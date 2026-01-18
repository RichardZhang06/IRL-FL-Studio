from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
import asyncio
import serial
import serial.tools.list_ports
from typing import List, Dict, Optional
from dataclasses import dataclass
import time
from collections import defaultdict

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

# Arduino serial connection
arduino = None


# ==============================================================================
# PLAYBACK ENGINE - WITH CHORD SUPPORT
# ==============================================================================

@dataclass
class NoteSchedule:
    """Represents a scheduled note with timing information."""
    id: int
    pitchName: str
    step: int
    time_seconds: float  # When to play (in seconds from start)
    stringNumber: Optional[int] = None  # Guitar string (0-5)
    fretNumber: Optional[int] = None    # Fret position (-1, 0, 1-4)
    noteGroup: Optional[int] = None     # Note group index (0-5)


class PlaybackEngine:
    """
    Playback engine with chord support.
    Groups notes at the same time position and sends them together.
    """
    
    def __init__(self, arduino, websocket):
        self.arduino = arduino
        self.websocket = websocket
        
        # Settings
        self.bpm = 120
        self.steps_per_beat = 1  # 1 step = 1 beat
        
        # Playback state
        self.is_playing = False
        self.playhead_step = 0.0
        self.start_time = 0.0
        
        # Note queue
        self.note_queue: List[NoteSchedule] = []
        self.played_notes = set()  # Use set for faster lookups
        
        # Timing loop
        self.loop_task = None
        self.reader_task = None
    
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
                    time_seconds=time_seconds,
                    stringNumber=note.get('stringNumber'),
                    fretNumber=note.get('fretNumber'),
                    noteGroup=note.get('noteGroup')
                )
                self.note_queue.append(note_schedule)
        
        # Sort by time
        self.note_queue.sort(key=lambda n: n.time_seconds)
        
        # Group notes by time for chord detection
        self._group_simultaneous_notes()
        
        print(f"✓ Loaded {len(self.note_queue)} notes starting from step {playhead_step:.1f}")
    
    def _group_simultaneous_notes(self):
        """
        Group notes that occur at the same time.
        This helps identify chords and send them together to Arduino.
        """
        # Group notes by time (with small tolerance for floating point)
        time_groups = defaultdict(list)
        for note in self.note_queue:
            # Round to nearest 10ms to group simultaneous notes
            time_key = round(note.time_seconds, 2)
            time_groups[time_key].append(note)
        
        # Log chords (2+ notes at same time)
        chord_count = sum(1 for notes in time_groups.values() if len(notes) > 1)
        if chord_count > 0:
            print(f"✓ Detected {chord_count} chord(s) in sequence")
    
    async def play(self, notes: List[Dict], bpm: int, playhead_step: float):
        """
        Start playback from a specific step position.
        """
        if self.is_playing:
            print("⚠ Already playing - stopping first")
            await self.stop()
        
        print(f"\n{'='*70}")
        print(f"▶ PLAY from step {playhead_step:.1f} at {bpm} BPM")
        print(f"  Total notes: {len(notes)}")
        print(f"{'='*70}")
        
        # Update settings
        self.bpm = bpm
        self.playhead_step = playhead_step
        self.is_playing = True
        self.start_time = time.time()
        
        # Load notes
        self.load_notes(notes, playhead_step)
        
        # Send PLAY to Arduino
        if self.arduino:
            try:
                self.arduino.write(b"PLAY\n")
                self.arduino.flush()
                print("✓ Sent PLAY command to Arduino")
            except serial.SerialException as e:
                print(f"✗ Serial error on PLAY: {e}")
        
        # Start timing loop and serial reader
        self.loop_task = asyncio.create_task(self._timing_loop())
        if self.arduino:
            self.reader_task = asyncio.create_task(self._serial_reader())
    
    async def stop(self):
        """Stop playback and reset."""
        print("\n■ STOP")
        
        self.is_playing = False
        
        # Cancel timing loop
        if self.loop_task and not self.loop_task.done():
            self.loop_task.cancel()
            try:
                await self.loop_task
            except asyncio.CancelledError:
                pass
        
        # Cancel serial reader
        if self.reader_task and not self.reader_task.done():
            self.reader_task.cancel()
            try:
                await self.reader_task
            except asyncio.CancelledError:
                pass
        
        # Send STOP to Arduino
        if self.arduino:
            try:
                self.arduino.write(b"STOP\n")
                self.arduino.flush()
                print("✓ Sent STOP command to Arduino")
            except serial.SerialException as e:
                print(f"✗ Serial error on STOP: {e}")
    
    async def _timing_loop(self):
        """
        Main timing loop - checks every 10ms.
        Groups simultaneous notes and plays them together.
        """
        try:
            while self.is_playing:
                # Calculate current time
                elapsed = time.time() - self.start_time
                current_step = self.playhead_step + self.seconds_to_step(elapsed)
                
                # Check for notes to play (group by time)
                notes_to_play = []
                for note in self.note_queue:
                    if note.time_seconds <= elapsed and note.id not in self.played_notes:
                        notes_to_play.append(note)
                        self.played_notes.add(note.id)
                
                # Group simultaneous notes (within 20ms window)
                if notes_to_play:
                    grouped = self._group_notes_by_time(notes_to_play)
                    for note_group in grouped:
                        if len(note_group) > 1:
                            # Chord - send all notes together
                            await self._play_chord(note_group, current_step, elapsed)
                        else:
                            # Single note
                            await self._play_note(note_group[0], current_step, elapsed)
                
                # Check if complete
                if len(self.played_notes) >= len(self.note_queue) and self.note_queue:
                    print(f"\n✓ Sequence complete ({len(self.played_notes)} notes played)")
                    await self.stop()
                    break
                
                # Sleep 10ms
                await asyncio.sleep(0.01)
        
        except asyncio.CancelledError:
            print("⚠ Timing loop cancelled")
            raise
    
    def _group_notes_by_time(self, notes: List[NoteSchedule]) -> List[List[NoteSchedule]]:
        """
        Group notes that should play simultaneously.
        Notes within 20ms are considered simultaneous.
        """
        if not notes:
            return []
        
        # Sort by time
        sorted_notes = sorted(notes, key=lambda n: n.time_seconds)
        
        groups = []
        current_group = [sorted_notes[0]]
        
        for note in sorted_notes[1:]:
            # If within 20ms of first note in group, add to group
            if abs(note.time_seconds - current_group[0].time_seconds) < 0.02:
                current_group.append(note)
            else:
                # Start new group
                groups.append(current_group)
                current_group = [note]
        
        # Add last group
        if current_group:
            groups.append(current_group)
        
        return groups
    
    def _format_note_info(self, note: NoteSchedule) -> str:
        """Format note info for logging."""
        info = f"{note.pitchName:5s}"
        if note.noteGroup is not None:
            fret_str = "Open" if note.fretNumber == 0 else f"Fr.{note.fretNumber}"
            info += f" [Str.{note.noteGroup} {fret_str:5s}]"
        return info
    
    async def _play_chord(self, notes: List[NoteSchedule], current_step: float, elapsed: float):
        """Play multiple notes simultaneously (a chord)."""
        # Format chord info
        chord_notes = " + ".join([self._format_note_info(n) for n in notes])
        
        print(f"\n[{elapsed:6.2f}s] Step {current_step:6.1f}")
        print(f"  ♫ CHORD ({len(notes)} notes): {chord_notes}")
        
        # Send all notes to Arduino
        if self.arduino:
            try:
                # Send chord start marker
                self.arduino.write(b"CHORD_START\n")
                self.arduino.flush()
                await asyncio.sleep(0.005)  # 5ms delay
                
                print(f"  → Arduino: CHORD_START")
                
                # Send each note in the chord
                for note in notes:
                    if note.noteGroup is not None:
                        fret = note.fretNumber if note.fretNumber is not None else 0
                        cmd = f"S:{note.noteGroup}:{fret}:{note.pitchName}"
                    else:
                        cmd = f"N:{note.pitchName}"
                    
                    self.arduino.write(f"{cmd}\n".encode())
                    self.arduino.flush()
                    print(f"  → Arduino: {cmd}")
                    await asyncio.sleep(0.005)  # 5ms between notes in chord
                
                # Send chord end marker
                self.arduino.write(b"CHORD_END\n")
                self.arduino.flush()
                print(f"  → Arduino: CHORD_END")
                
            except serial.SerialException as e:
                print(f"  ✗ Serial error playing chord: {e}")
                await self.stop()
    
    async def _play_note(self, note: NoteSchedule, current_step: float, elapsed: float):
        """Play a single note with string/fret information."""
        note_info = self._format_note_info(note)
        
        print(f"\n[{elapsed:6.2f}s] Step {current_step:6.1f}")
        print(f"  ♪ NOTE: {note_info}")
        
        # Send to Arduino with noteGroup (string number)
        if self.arduino:
            try:
                if note.noteGroup is not None:
                    fret = note.fretNumber if note.fretNumber is not None else 0
                    cmd = f"S:{note.noteGroup}:{fret}:{note.pitchName}"
                else:
                    cmd = f"N:{note.pitchName}"
                
                self.arduino.write(f"{cmd}\n".encode())
                self.arduino.flush()
                print(f"  → Arduino: {cmd}")
                await asyncio.sleep(0.01)  # 10ms delay to prevent buffer overflow
                
            except serial.SerialException as e:
                print(f"  ✗ Serial error: {e}")
                await self.stop()
    
    async def _serial_reader(self):
        """Read responses from Arduino."""
        try:
            while self.is_playing:
                if self.arduino and self.arduino.in_waiting > 0:
                    try:
                        response = self.arduino.readline().decode('utf-8').strip()
                        if response:
                            print(f"  ← Arduino: {response}")
                    except Exception as e:
                        print(f"  ✗ Error reading from Arduino: {e}")
                await asyncio.sleep(0.05)
        except asyncio.CancelledError:
            pass


# ==============================================================================
# ARDUINO CONNECTION
# ==============================================================================

def find_arduino():
    """Auto-detect Arduino port"""
    ports = serial.tools.list_ports.comports()
    for port in ports:
        desc = port.description.lower()
        device = port.device.lower()
        # Check both description and device path
        if any(x in desc for x in ["arduino", "ch340", "usb serial", "iousbhostdevice"]):
            return port.device
        if "usbmodem" in device or "usbserial" in device:
            return port.device
    return None


def connect_arduino():
    """Connect to Arduino via USB serial"""
    global arduino
    try:
        port = find_arduino()
        if port:
            arduino = serial.Serial(port, 9600, timeout=1)
            time.sleep(2)  # Wait for Arduino to reset
            print(f"✓ Connected to Arduino on {port}")
            return True
        else:
            print("✗ Arduino not found")
            return False
    except Exception as e:
        print(f"✗ Failed to connect to Arduino: {e}")
        return False


# ==============================================================================
# FASTAPI WEBSOCKET
# ==============================================================================

@app.on_event("startup")
async def startup():
    """Try to connect to Arduino on startup"""
    print("\n" + "="*70)
    print("GUITAR SEQUENCER BACKEND")
    print("="*70)
    connect_arduino()
    print("="*70 + "\n")


@app.websocket("/ws/notes")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    clients.append(websocket)
    
    print(f"✓ WebSocket client connected")
    
    # Create playback engine
    engine = None
    if arduino:
        engine = PlaybackEngine(arduino, websocket)
        print("✓ Playback engine ready")
    else:
        print("⚠ No Arduino - playback engine not created")
    
    try:
        while True:
            data = await websocket.receive_json()
            print(f"Received from frontend: {data}")  # Add this line back
            
            # Check if engine exists
            if not engine:
                print("Arduino not connected")
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
                print(f"Unknown action: {data.get('action')}")
    
    except Exception as e:
        print(f"✗ WebSocket error: {e}")
        import traceback
        traceback.print_exc()
    
    finally:
        # Cleanup
        if engine:
            await engine.stop()
        clients.remove(websocket)
        print("✗ WebSocket client disconnected\n")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)