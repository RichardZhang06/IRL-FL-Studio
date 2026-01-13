import { useState } from "react";
import PianoKeyboard from "./PianoKeyboard";
import Grid from "./Grid";
import { CUSTOM_NOTES } from "../constants";

type Note = {
  id: number;
  pitchName: string;
  step: number;
};

export default function PianoRoll() {
  const [notes, setNotes] = useState<Note[]>([]);

  const addNote = (pitchName: string, step: number) => {
    setNotes((prev) => [...prev, { id: prev.length + 1, pitchName, step }]);
  };

  const updateNote = (id: number, newStep: number) => {
    setNotes((prev) =>
      prev.map((n) => (n.id === id ? { ...n, step: newStep } : n))
    );
  };

  const deleteNote = (id: number) => {
    setNotes((prev) => prev.filter((n) => n.id !== id));
  };

  return (
    <div className="piano-roll" style={{ display: "flex", height: "100vh" }}>
      <PianoKeyboard />
      <Grid
        notes={notes}
        addNote={addNote}
        updateNote={updateNote}
        deleteNote={deleteNote}
      />
    </div>
  );
}
