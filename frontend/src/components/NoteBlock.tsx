import React, { useState } from "react";
import { STEP_WIDTH } from "../constants";

type Note = {
  id: number;
  pitchName: string;
  step: number;
};

type Props = {
  note: Note;
  onMove?: (id: number, newStep: number) => void;
  onDelete?: (id: number) => void;
};

export default function NoteBlock({ note, onMove, onDelete }: Props) {
  const [dragging, setDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // left click only
    setDragging(true);
    setDragOffset(e.clientX);
    e.stopPropagation();
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragging || !onMove) return;
    const delta = e.clientX - dragOffset;
    const stepChange = Math.round(delta / STEP_WIDTH);
    if (stepChange !== 0) {
      onMove(note.id, note.step + stepChange);
      setDragOffset(e.clientX);
    }
  };

  const handleMouseUp = () => {
    setDragging(false);
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    if (onDelete) onDelete(note.id);
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
        zIndex: dragging ? 10 : 1,
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onContextMenu={handleContextMenu}
    />
  );
}
