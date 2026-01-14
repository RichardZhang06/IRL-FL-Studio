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
  const rafRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);

  const nextId = useRef(1);

  useNotesWebSocket(notes, playing, bpm);

  const addNote = (pitchName: string, step: number) => {
    setNotes((prev) => [
      ...prev,
      { id: nextId.current++, pitchName, step },
    ]);
  };

  const deleteNote = (id: number) => {
    setNotes((prev) => prev.filter((n) => n.id !== id));
  };

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
        if (lastTimeRef.current == null) {
        lastTimeRef.current = time;
        }

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

  const handleReset = () => {
    setPlaying(false);
    setPlayheadX(0);
  };


  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column" }}>
      <TopBar
        playing={playing}
        bpm={bpm}
        onTogglePlay={() => setPlaying((p) => !p)}
        onReset={handleReset}
        onBpmChange={setBpm}
      />

      <div className="piano-roll" style={{ display: "flex", flex: 1 }}>
        <PianoKeyboard />
        <Grid notes={notes} addNote={addNote} deleteNote={deleteNote} playheadX={playheadX} />
      </div>
    </div>
  );
}
