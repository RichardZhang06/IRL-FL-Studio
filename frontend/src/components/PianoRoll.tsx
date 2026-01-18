// PianoRoll.tsx
import { useEffect, useRef, useState } from "react";
import { 
  STEP_WIDTH, 
  NUM_STEPS as INITIAL_NUM_STEPS, 
  findNoteGroup, 
  BEATS_AHEAD, 
  MIN_NOTES 
} from "../constants";
import PianoKeyboard from "./PianoKeyboard";
import Fretboard from "./Fretboard";
import Grid from "./Grid";
import TopBar from "./TopBar";
import useNotesWebSocket from "./useNotesWebSocket";

export type Note = {
  id: number;
  pitchName: string;
  step: number;
};

export default function PianoRoll() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [playing, setPlaying] = useState(false);
  const [bpm, setBpm] = useState(120);
  const [playheadX, setPlayheadX] = useState(0);
  const [numSteps, setNumSteps] = useState(Math.max(MIN_NOTES, INITIAL_NUM_STEPS));
  const [showFretboard, setShowFretboard] = useState(true);

  const rafRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);
  const nextId = useRef(1);
  const gridRef = useRef<HTMLDivElement>(null);

  const { play, stop } = useNotesWebSocket();

  const addNote = (pitchName: string, step: number) => {
    const noteGroup = findNoteGroup(pitchName);
    setNotes((prev) => {
      const filteredNotes = noteGroup
        ? prev.filter(note => !(note.step === step && noteGroup.includes(note.pitchName)))
        : prev;
      
      return [...filteredNotes, { id: nextId.current++, pitchName, step }];
    });
  };

  const deleteNote = (id: number) => {
    setNotes((prev) => prev.filter((n) => n.id !== id));
  };

  const getActiveNotes = () => {
    const currentStep = Math.floor(playheadX / STEP_WIDTH);
    return notes
      .filter(note => note.step === currentStep)
      .map(note => note.pitchName);
  };

  const activeNotes = getActiveNotes();

  const handleTogglePlay = () => {
    if (playing) {
      stop();
      setPlaying(false);
    } else {
      play(notes, bpm, playheadX);
      setPlaying(true);
    }
  };

  const handleReset = () => {
    setPlaying(false);
    setPlayheadX(0);
  };

  const handleClearNotes = () => {
    setNotes([]);
    nextId.current = 1;
  };

  const handleAdjustSteps = (delta: number) => {
    setNumSteps((prev) => Math.max(MIN_NOTES, prev + delta));
  };

  const handleSavePreset = () => {
    const preset = { notes, bpm, numSteps };
    localStorage.setItem('pianoRollPreset', JSON.stringify(preset));
    alert('Preset saved!');
  };

  const handleLoadPreset = () => {
    const saved = localStorage.getItem('pianoRollPreset');
    if (!saved) {
      alert('No preset found!');
      return;
    }

    const preset = JSON.parse(saved);
    setNotes(preset.notes);
    setBpm(preset.bpm);
    setNumSteps(preset.numSteps);

    const maxId = preset.notes.reduce((max: number, note: Note) => 
      Math.max(max, note.id), 0);
    nextId.current = maxId + 1;

    alert('Preset loaded!');
  };

  // Playhead animation
  useEffect(() => {
    if (!playing) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      lastTimeRef.current = null;
      return;
    }

    const pixelsPerSecond = (bpm / 60) * STEP_WIDTH;
    const maxPlayheadX = numSteps * STEP_WIDTH;

    const tick = (time: number) => {
      if (lastTimeRef.current == null) lastTimeRef.current = time;

      const deltaSeconds = (time - lastTimeRef.current) / 1000;
      lastTimeRef.current = time;

      setPlayheadX((x) => {
        const newX = x + deltaSeconds * pixelsPerSecond;
        return newX >= maxPlayheadX ? 0 : newX;
      });

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [playing, bpm, numSteps]);

  // Auto-scroll
  useEffect(() => {
    if (gridRef.current && playing) {
      const scrollTarget = playheadX - (BEATS_AHEAD * STEP_WIDTH);
      gridRef.current.scrollLeft = Math.max(0, scrollTarget);
    }
  }, [playheadX, playing]);

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column" }}>
      <TopBar
        playing={playing}
        bpm={bpm}
        onTogglePlay={handleTogglePlay}
        onReset={handleReset}
        onClearNotes={handleClearNotes}
        onBpmChange={setBpm}
        onAdjustSteps={handleAdjustSteps}
        numSteps={numSteps}
        onSavePreset={handleSavePreset}
        onLoadPreset={handleLoadPreset}
        showFretboard={showFretboard}
        onToggleFretboard={() => setShowFretboard(!showFretboard)}
      />
      <div className="piano-roll" style={{ display: "flex", flex: 1, position: "relative" }}>
        <PianoKeyboard />
        <Grid
          ref={gridRef}
          notes={notes}
          addNote={addNote}
          deleteNote={deleteNote}
          playheadX={playheadX}
          numSteps={numSteps}
        />
        <Fretboard 
          visible={showFretboard} 
          activeNotes={activeNotes}
        />
      </div>
    </div>
  );
}