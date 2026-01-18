// NoteBlock.tsx
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
        background: "linear-gradient(135deg, #7db8ff 0%, #5a9de8 100%)",
        borderRadius: 4,
        cursor: "pointer",
        boxShadow: "0 2px 8px rgba(110, 166, 229, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.3)",
        transition: "all 0.15s ease",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-2px)";
        e.currentTarget.style.boxShadow = "0 4px 12px rgba(110, 166, 229, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.4)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "0 2px 8px rgba(110, 166, 229, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.3)";
      }}
      onClick={handleClick}
    />
  );
}
