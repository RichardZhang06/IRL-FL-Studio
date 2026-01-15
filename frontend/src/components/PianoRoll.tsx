// PianoRoll.tsx
import { useEffect, useRef, useState } from "react";
import { STEP_WIDTH } from "../constants";
import PianoKeyboard from "./PianoKeyboard";
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
  const [hoveredRow, setHoveredRow] = useState<number | null>(null);

  const rafRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);
  const nextId = useRef(1);

  // Connect to backend
  const { play, stop } = useNotesWebSocket();

  const addNote = (pitchName: string, step: number) => {
    setNotes((prev) => [
      ...prev,
      { id: nextId.current++, pitchName, step },
    ]);
  };

  const deleteNote = (id: number) => {
    setNotes((prev) => prev.filter((n) => n.id !== id));
  };

  // Tapehead animation
  useEffect(() => {
    if (!playing) {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      lastTimeRef.current = null;
      return;
    }

    const pixelsPerSecond = (bpm / 60) * STEP_WIDTH;

    const tick = (time: number) => {
      if (lastTimeRef.current == null) lastTimeRef.current = time;

      const deltaSeconds = (time - lastTimeRef.current) / 1000;
      lastTimeRef.current = time;

      setPlayheadX((x) => x + deltaSeconds * pixelsPerSecond);

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [playing, bpm]);

  const handleTogglePlay = () => {
    if (playing) {
      stop();
      setPlaying(false);
    } else {
      play(notes, bpm);
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


  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column" }}>
      <TopBar
        playing={playing}
        bpm={bpm}
        onTogglePlay={handleTogglePlay}
        onReset={handleReset}
        onClearNotes={handleClearNotes}
        onBpmChange={setBpm}
      />
      <div className="piano-roll" style={{ display: "flex", flex: 1 }}>
        <PianoKeyboard hoveredRow={hoveredRow} />
        <Grid
          notes={notes}
          addNote={addNote}
          deleteNote={deleteNote}
          playheadX={playheadX}
          hoveredRow={hoveredRow}
          setHoveredRow={setHoveredRow}
        />
      </div>
    </div>
  );
}