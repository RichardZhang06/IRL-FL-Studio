from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
import asyncio
import serial
import serial.tools.list_ports
from typing import List, Dict
from dataclasses import dataclass
import time

app = FastAPI()

# Allow requests from your frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# store connected clients
clients = []

# Teensy serial connection
teensy = None


# ==============================================================================
# PLAYBACK ENGINE - SIMPLIFIED
# ==============================================================================

@dataclass
class NoteSchedule:
    """Represents a scheduled note with timing information."""
    id: int
    pitchName: str
    step: int
    time_seconds: float  # When to play (in seconds from start)


class PlaybackEngine:
    """
    Simple playback engine with timing.
    Only supports play and stop (matches frontend).
    """
    
    def __init__(self, teensy, websocket):
        self.teensy = teensy
        self.websocket = websocket
        
        # Settings
        self.bpm = 120
        self.steps_per_beat = 16  # 16th note grid (matches STEP_WIDTH)
        
        # Playback state
        self.is_playing = False
        self.playhead_step = 0.0
        self.start_time = 0.0
        
        # Note queue
        self.note_queue: List[NoteSchedule] = []
        self.played_notes = []
        
        # Timing loop
        self.loop_task = None
    
    def step_to_seconds(self, step: float) -> float:
        """Convert step position to seconds based on BPM."""
        beat = step / self.steps_per_beat
        beat_duration = 60.0 / self.bpm
        return beat * beat_duration
    
    def seconds_to_step(self, seconds: float) -> float:
        """Convert seconds to step position."""
        beat_duration = 60.0 / self.bpm
        beats = seconds / beat_duration
        return beats * self.steps_per_beat
    
    def load_notes(self, notes: List[Dict], playhead_step: float):
        """
        Load notes into queue.
        Only loads notes AFTER the playhead position.
        """
        self.note_queue.clear()
        self.played_notes.clear()
        
        for note in notes:
            # Only queue notes after playhead
            if note['step'] >= playhead_step:
                # Calculate when to play (relative to start)
                relative_step = note['step'] - playhead_step
                time_seconds = self.step_to_seconds(relative_step)
                
                note_schedule = NoteSchedule(
                    id=note['id'],
                    pitchName=note['pitchName'],
                    step=note['step'],
                    time_seconds=time_seconds
                )
                self.note_queue.append(note_schedule)
        
        # Sort by time
        self.note_queue.sort(key=lambda n: n.time_seconds)
        
        print(f"📋 Loaded {len(self.note_queue)} notes starting from step {playhead_step:.1f}")
    
    async def play(self, notes: List[Dict], bpm: int, playhead_step: float):
        """
        Start playback from a specific step position.
        Matches frontend play() function.
        """
        if self.is_playing:
            print("⚠️ Already playing - stopping first")
            await self.stop()
        
        print(f"\n{'='*60}")
        print(f"▶️ PLAY from step {playhead_step:.1f} at {bpm} BPM")
        print(f"   Total notes: {len(notes)}")
        print(f"{'='*60}")
        
        # Update settings
        self.bpm = bpm
        self.playhead_step = playhead_step
        self.is_playing = True
        self.start_time = time.time()
        
        # Load notes
        self.load_notes(notes, playhead_step)
        
        # Send PLAY to Teensy
        if self.teensy:
            self.teensy.write(b"PLAY\n")
        
        # Send status to frontend
        await self.websocket.send_json({
            "type": "playback",
            "status": "playing",
            "playheadStep": playhead_step,
            "bpm": bpm
        })
        
        # Start timing loop
        self.loop_task = asyncio.create_task(self._timing_loop())
    
    async def stop(self):
        """
        Stop playback and reset.
        Matches frontend stop() function.
        """
        print("⏹️ Stopping playback")
        
        self.is_playing = False
        
        # Cancel timing loop
        if self.loop_task and not self.loop_task.done():
            self.loop_task.cancel()
            try:
                await self.loop_task
            except asyncio.CancelledError:
                pass
        
        # Send STOP to Teensy
        if self.teensy:
            self.teensy.write(b"STOP\n")
        
        # Send status to frontend
        await self.websocket.send_json({
            "type": "playback",
            "status": "stopped"
        })
    
    async def _timing_loop(self):
        """
        Main timing loop - checks every 10ms.
        Plays notes when playhead reaches their time.
        """
        try:
            while self.is_playing:
                # Calculate current time
                elapsed = time.time() - self.start_time
                current_step = self.playhead_step + self.seconds_to_step(elapsed)
                
                # Check for notes to play
                notes_to_play = []
                for note in self.note_queue:
                    if note.time_seconds <= elapsed and note.id not in self.played_notes:
                        notes_to_play.append(note)
                        self.played_notes.append(note.id)
                
                # Play notes
                for note in notes_to_play:
                    await self._play_note(note, current_step)
                
                # Send playhead update (every 100ms)
                if int(elapsed * 10) % 10 == 0:
                    await self.websocket.send_json({
                        "type": "playhead_update",
                        "playheadStep": current_step,
                        "time": elapsed
                    })
                
                # Check if complete
                if len(self.played_notes) >= len(self.note_queue) and self.note_queue:
                    print("✅ Sequence complete")
                    await self.stop()
                    await self.websocket.send_json({
                        "type": "playback",
                        "status": "complete"
                    })
                    break
                
                # Sleep 10ms
                await asyncio.sleep(0.01)
        
        except asyncio.CancelledError:
            print("⏹️ Timing loop cancelled")
            raise
    
    async def _play_note(self, note: NoteSchedule, current_step: float):
        """Play a single note."""
        print(f"♪ {note.pitchName:4s} at step {current_step:.1f}")
        
        # Send to Teensy
        if self.teensy:
            cmd = f"NOTE:{note.pitchName},{note.step},{self.bpm}\n"
            self.teensy.write(cmd.encode())
        
        # Send to frontend
        await self.websocket.send_json({
            "type": "note_playing",
            "id": note.id,
            "pitchName": note.pitchName,
            "step": note.step,
            "playheadStep": current_step
        })


# ==============================================================================
# TEENSY CONNECTION
# ==============================================================================

def find_teensy():
    """Auto-detect Teensy port"""
    ports = serial.tools.list_ports.comports()
    for port in ports:
        if "teensy" in port.description.lower() or "usb" in port.description.lower():
            return port.device
    return None


def connect_teensy():
    """Connect to Teensy via USB serial"""
    global teensy
    try:
        port = find_teensy()
        if port:
            teensy = serial.Serial(port, 115200, timeout=1)
            print(f"✅ Connected to Teensy on {port}")
            return True
        else:
            print("⚠️ Teensy not found")
            return False
    except Exception as e:
        print(f"❌ Failed to connect to Teensy: {e}")
        return False


# ==============================================================================
# FASTAPI WEBSOCKET
# ==============================================================================

@app.on_event("startup")
async def startup():
    """Try to connect to Teensy on startup"""
    connect_teensy()


@app.websocket("/ws/notes")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    clients.append(websocket)
    
    print(f"✅ WebSocket connected")
    
    # Send connection status
    try:
        await websocket.send_json({
            "type": "connection",
            "teensy_connected": teensy is not None
        })
        print(f"📤 Sent connection status: teensy_connected={teensy is not None}")
    except Exception as e:
        print(f"⚠️ Error sending connection status: {e}")
    
    # Create playback engine
    engine = None
    if teensy:
        engine = PlaybackEngine(teensy, websocket)
        print("✅ Playback engine created")
    else:
        print("⚠️ No Teensy - playback engine not created")
    
    try:
        while True:
            print("📥 Waiting for message from frontend...")
            data = await websocket.receive_json()
            print(f"📨 Received: {data}")
            
            # Check if engine exists
            if not engine:
                print("❌ No engine - Teensy not connected")
                await websocket.send_json({
                    "type": "error",
                    "message": "Teensy not connected"
                })
                continue
            
            # ============================================================
            # PLAY - Start playback
            # ============================================================
            if data.get("action") == "play":
                notes = data.get("notes", [])
                bpm = data.get("bpm", 120)
                playhead_step = data.get("playheadStep", 0.0)
                
                await engine.play(notes, bpm, playhead_step)
            
            # ============================================================
            # STOP - Stop playback
            # ============================================================
            elif data.get("action") == "stop":
                await engine.stop()
            
            # ============================================================
            # Unknown action
            # ============================================================
            else:
                print(f"⚠️ Unknown action: {data.get('action')}")
                # Broadcast to other clients (if any)
                for client in clients:
                    if client != websocket:
                        await client.send_json(data)
    
    except Exception as e:
        print(f"❌ WebSocket error: {e}")
        import traceback
        traceback.print_exc()
    
    finally:
        # Cleanup
        print("🔌 Cleaning up...")
        if engine:
            await engine.stop()
        clients.remove(websocket)
        print("✅ Client disconnected")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)