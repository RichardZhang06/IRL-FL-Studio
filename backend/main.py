from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
import asyncio
import serial
import serial.tools.list_ports
from typing import List, Dict, Optional
from dataclasses import dataclass
from enum import Enum
import time

app = FastAPI()

# Allow requests from your frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # change this to your frontend origin in production
    allow_methods=["*"],
    allow_headers=["*"],
)

# store connected clients
clients = []

# Teensy serial connection
teensy = None


# ==============================================================================
# PLAYBACK ENGINE
# ==============================================================================

class PlaybackState(Enum):
    STOPPED = "stopped"
    PLAYING = "playing"
    PAUSED = "paused"


@dataclass
class NoteSchedule:
    """Represents a scheduled note with timing information."""
    id: int
    pitchName: str
    step: int
    time_seconds: float  # When to play (in seconds from start)


class PlaybackEngine:
    """
    Manages playhead-based timing and note scheduling.
    Uses step-based positions to match frontend.
    """
    
    def __init__(self, teensy, websocket):
        self.teensy = teensy
        self.websocket = websocket
        
        # Playback state
        self.state = PlaybackState.STOPPED
        self.bpm = 120
        self.steps_per_beat = 16  # 16th note grid (matches STEP_WIDTH constant)
        
        # Timing
        self.playhead_step = 0.0  # Current step position
        self.playhead_time = 0.0  # Elapsed time in seconds
        self.start_time = 0.0     # When playback started (wall clock)
        self.pause_time = 0.0     # Time when paused
        
        # Note queue
        self.note_queue: List[NoteSchedule] = []
        self.played_notes = set()  # Track which notes have been played
        
        # Timing loop
        self.loop_task = None
        self.loop_interval = 0.01  # Check every 10ms
    
    def step_to_seconds(self, step: int) -> float:
        """Convert step position to seconds based on BPM."""
        beat = step / self.steps_per_beat
        beat_duration = 60.0 / self.bpm
        return beat * beat_duration
    
    def seconds_to_step(self, seconds: float) -> float:
        """Convert seconds to step position."""
        beat_duration = 60.0 / self.bpm
        beats = seconds / beat_duration
        return beats * self.steps_per_beat
    
    def load_notes(self, notes: List[Dict], playhead_step: float = 0.0):
        """
        Load notes into the queue.
        Only loads notes AFTER the playhead position.
        
        Args:
            notes: List of note dicts from frontend
                   Each note: { id, pitchName, step }
            playhead_step: Starting step position
        """
        self.note_queue.clear()
        self.played_notes.clear()
        
        for note in notes:
            # Only queue notes that are AFTER the playhead
            if note['step'] >= playhead_step:
                # Calculate relative time from playhead position
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
        
        print(f"📋 Loaded {len(self.note_queue)} notes (starting from step {playhead_step:.1f})")
        if self.note_queue:
            print(f"   First note: {self.note_queue[0].pitchName} at step {self.note_queue[0].step}")
            print(f"   Last note: {self.note_queue[-1].pitchName} at step {self.note_queue[-1].step}")
    
    async def start(self, playhead_step: float = 0.0):
        """
        Start playback from a specific step position.
        
        Args:
            playhead_step: Step position to start from
        """
        if self.state == PlaybackState.PLAYING:
            print("⚠️ Already playing")
            return
        
        print(f"▶️ Starting playback from step {playhead_step:.1f}")
        
        self.state = PlaybackState.PLAYING
        self.playhead_step = playhead_step
        self.playhead_time = 0.0
        self.start_time = time.time()
        
        # Send PLAY to Teensy
        if self.teensy:
            self.teensy.write(b"PLAY\n")
        
        # Send status to frontend
        await self.websocket.send_json({
            "type": "playback",
            "status": "playing",
            "playheadStep": playhead_step,
            "bpm": self.bpm
        })
        
        # Start timing loop
        if self.loop_task is None or self.loop_task.done():
            self.loop_task = asyncio.create_task(self._timing_loop())
    
    async def pause(self):
        """Pause playback at current position."""
        if self.state != PlaybackState.PLAYING:
            print("⚠️ Not playing")
            return
        
        self.state = PlaybackState.PAUSED
        self.pause_time = time.time()
        
        current_step = self.playhead_step + self.seconds_to_step(self.playhead_time)
        
        print(f"⏸️ Paused at step {current_step:.1f}")
        
        # Send STOP to Teensy
        if self.teensy:
            self.teensy.write(b"STOP\n")
        
        # Send status to frontend
        await self.websocket.send_json({
            "type": "playback",
            "status": "paused",
            "playheadStep": current_step
        })
    
    async def resume(self):
        """Resume playback from paused position."""
        if self.state != PlaybackState.PAUSED:
            print("⚠️ Not paused")
            return
        
        print(f"▶️ Resuming from step {self.playhead_step:.1f}")
        
        self.state = PlaybackState.PLAYING
        
        # Adjust start time to account for pause duration
        pause_duration = time.time() - self.pause_time
        self.start_time += pause_duration
        
        # Send PLAY to Teensy
        if self.teensy:
            self.teensy.write(b"PLAY\n")
        
        # Send status to frontend
        await self.websocket.send_json({
            "type": "playback",
            "status": "playing",
            "playheadStep": self.playhead_step
        })
    
    async def stop(self):
        """Stop playback and reset playhead."""
        print("⏹️ Stopping playback")
        
        self.state = PlaybackState.STOPPED
        self.playhead_time = 0.0
        self.playhead_step = 0.0
        
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
            "status": "stopped",
            "playheadStep": 0.0
        })
    
    async def seek(self, target_step: float, notes: List[Dict]):
        """
        Jump to a specific step position.
        Reloads note queue with only notes after the target position.
        
        Args:
            target_step: Step position to jump to
            notes: All notes in the sequence
        """
        print(f"⏩ Seeking to step {target_step:.1f}")
        
        was_playing = (self.state == PlaybackState.PLAYING)
        
        # Pause if playing
        if was_playing:
            self.state = PlaybackState.PAUSED
        
        # Update playhead position
        self.playhead_step = target_step
        self.playhead_time = 0.0
        self.start_time = time.time()
        
        # Reload notes from new position
        self.load_notes(notes, target_step)
        
        # Resume if was playing
        if was_playing:
            await self.resume()
        
        # Send status to frontend
        await self.websocket.send_json({
            "type": "playback",
            "status": self.state.value,
            "playheadStep": target_step
        })
    
    async def _timing_loop(self):
        """
        Main timing loop - runs every ~10ms.
        Checks if any notes should be played based on playhead position.
        """
        try:
            while self.state == PlaybackState.PLAYING:
                # Calculate current playhead time
                elapsed = time.time() - self.start_time
                self.playhead_time = elapsed
                current_step = self.playhead_step + self.seconds_to_step(elapsed)
                
                # Check for notes to play
                notes_to_play = []
                for note in self.note_queue:
                    if note.time_seconds <= elapsed and note not in self.played_notes:
                        notes_to_play.append(note)
                        self.played_notes.add(note)
                
                # Play notes
                for note in notes_to_play:
                    await self._play_note(note, current_step)
                
                # Send playhead update to frontend (every 100ms)
                if int(elapsed * 10) % 10 == 0:  # Every 10th iteration
                    await self.websocket.send_json({
                        "type": "playhead_update",
                        "playheadStep": current_step,
                        "time": elapsed
                    })
                
                # Check if sequence is complete
                if len(self.played_notes) >= len(self.note_queue) and self.note_queue:
                    print("✅ Sequence complete")
                    await self.stop()
                    await self.websocket.send_json({
                        "type": "playback",
                        "status": "complete"
                    })
                    break
                
                # Sleep until next check
                await asyncio.sleep(self.loop_interval)
        
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
    
    # Send connection status
    await websocket.send_json({
        "type": "connection",
        "teensy_connected": teensy is not None
    })
    
    # Create playback engine for this client
    engine = None
    if teensy:
        engine = PlaybackEngine(teensy, websocket)
    
    try:
        while True:
            data = await websocket.receive_json()
            
            if not engine:
                await websocket.send_json({
                    "type": "error",
                    "message": "Teensy not connected"
                })
                continue
            
            # ============================================================
            # PLAY - Start from specific position
            # ============================================================
            if data.get("action") == "play":
                notes = data.get("notes", [])
                bpm = data.get("bpm", 120)
                playhead_step = data.get("playheadStep", 0.0)  # Step position from frontend
                
                print(f"\n{'='*60}")
                print(f"▶️ PLAY from step {playhead_step:.1f} at {bpm} BPM")
                print(f"   Total notes: {len(notes)}")
                print(f"{'='*60}")
                
                engine.bpm = bpm
                engine.load_notes(notes, playhead_step)
                await engine.start(playhead_step)
            
            # ============================================================
            # PAUSE - Pause at current position
            # ============================================================
            elif data.get("action") == "pause":
                await engine.pause()
            
            # ============================================================
            # RESUME - Continue from paused position
            # ============================================================
            elif data.get("action") == "resume":
                await engine.resume()
            
            # ============================================================
            # STOP - Stop and reset
            # ============================================================
            elif data.get("action") == "stop":
                await engine.stop()
            
            # ============================================================
            # SEEK - Jump to position (scrubbing)
            # ============================================================
            elif data.get("action") == "seek":
                target_step = data.get("playheadStep", 0.0)
                notes = data.get("notes", [])
                await engine.seek(target_step, notes)
            
            # ============================================================
            # UPDATE BPM - Change tempo
            # ============================================================
            elif data.get("action") == "set_bpm":
                new_bpm = data.get("bpm", 120)
                print(f"🎵 BPM changed: {engine.bpm} → {new_bpm}")
                engine.bpm = new_bpm
                await websocket.send_json({
                    "type": "bpm_updated",
                    "bpm": new_bpm
                })
            
            # Original behavior - broadcast to other clients
            else:
                print("Received:", data)
                for client in clients:
                    if client != websocket:
                        await client.send_json(data)
    
    except Exception as e:
        print(f"❌ WebSocket error: {e}")
    
    finally:
        # Cleanup
        if engine:
            await engine.stop()
        clients.remove(websocket)
        print("✅ Client disconnected")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)