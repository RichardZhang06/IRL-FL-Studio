import React from "react";
import { STEP_WIDTH } from "../constants";

type Note = {
  id: number;
  pitchName: string;
  step: number;
};

type Props = {
  note: Note;
  onDelete?: (id: number) => void;
};

export default function NoteBlock({ note, onDelete }: Props) {
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // prevent Grid from adding a new note
    onDelete?.(note.id);
  };

  return (
    <div
      className="note"
      style={{
        position: "absolute",
        left: note.step * STEP_WIDTH,
        top: 0,
        width: STEP_WIDTH,
        height: "100%",
        background: "#7dff9b",
        borderRadius: 4,
        cursor: "pointer",
      }}
      onClick={handleClick}
    />
  );
}
