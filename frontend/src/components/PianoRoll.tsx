// PianoRoll.tsx
import { useRef, useState } from "react";
import PianoKeyboard from "./PianoKeyboard";
import Grid from "./Grid";
import { CUSTOM_NOTES } from "../constants";
import useNotesWebSocket from "./useNotesWebSocket";

export type Note = {
  id: number;
  pitchName: string;
  step: number;
};

export default function PianoRoll() {
  const [notes, setNotes] = useState<Note[]>([]);
  const nextId = useRef(1);

  // Hook to send notes to backend via WebSocket
  useNotesWebSocket(notes);

  const addNote = (pitchName: string, step: number) => {
    setNotes((prev) => [...prev, { id: nextId.current++, pitchName, step }]);
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
        deleteNote={deleteNote}
      />
    </div>
  );
}
