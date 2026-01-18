// Grid.tsx
import { forwardRef } from "react";
import { STEP_WIDTH, CUSTOM_NOTES, NOTE_GROUPS } from "../constants";
import NoteBlock from "./NoteBlock";

type Note = {
  id: number;
  pitchName: string;
  step: number;
};

type GridProps = {
  notes: Note[];
  addNote: (pitchName: string, step: number) => void;
  deleteNote: (id: number) => void;
  playheadX: number;
  numSteps: number;
  activeNotes?: string [];
};

const Grid = forwardRef<HTMLDivElement, GridProps>(({
  notes,
  addNote,
  deleteNote,
  playheadX,
  numSteps,
  activeNotes = []
}, ref) => {
  const numRows = CUSTOM_NOTES.length;
  const gridWidth = numSteps * STEP_WIDTH;

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const grid = e.currentTarget;
    const rect = grid.getBoundingClientRect();
    const x = e.clientX - rect.left + grid.scrollLeft;
    const y = e.clientY - rect.top + grid.scrollTop;

    const step = Math.floor(x / STEP_WIDTH);
    const rowHeight = rect.height / numRows;
    const rowIndex = Math.floor(y / rowHeight);
    const pitchName = CUSTOM_NOTES[rowIndex];

    addNote(pitchName, step);
  };

  return (
    <div
      ref={ref}
      className="grid"
      style={{
        flex: 1,
        height: "100%",
        overflow: "auto",
        position: "relative",
        backgroundColor: "#f5f5f5",
      }}
      onClick={handleClick}
    >
      <div
        style={{
          position: "absolute",
          left: playheadX,
          top: 0,
          bottom: 0,
          width: "2px",
          background: "red",
          pointerEvents: "none",
          zIndex: 10,
        }}
      />

      <div
        style={{
          height: "100%",
          width: gridWidth,
          display: "grid",
          gridTemplateRows: `repeat(${numRows}, 1fr)`,
        }}
      >
        {CUSTOM_NOTES.map((noteName, rowIndex) => {
          const rowNotes = notes.filter((n) => n.pitchName === noteName);
          const isEvenRow = rowIndex % 2 === 0;

          const isGroupBoundary = NOTE_GROUPS.some(group => 
            group[0] === noteName && rowIndex > 0
          );
          const isActive = activeNotes.includes(noteName);

          return (
            <div
              key={noteName}
              className="grid-row"
              style={{
                position: "relative",
                width: "100%",
                height: "100%",
                backgroundColor: isActive 
                  ? (isEvenRow ? "#2d323a" : "#2d323a")
                  : isEvenRow 
                    ? "#2a2a2a" 
                    : "#252525",
                backgroundImage: `linear-gradient(to right, #444 1px, transparent 1px)`,
                backgroundSize: `${STEP_WIDTH}px 100%`,
                transition: "background-color 0.1s ease",
                boxShadow: isActive ? "inset 0 0 15px rgba(125, 255, 155, 0.08)" : "none",
              }}
            >
              {isGroupBoundary && (
                <div
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    height: "1px",
                    backgroundColor: "#444",
                    zIndex: 5,
                  }}
                />
              )}
              {rowNotes.map((note) => (
                <NoteBlock
                  key={note.id}
                  note={note}
                  onDelete={deleteNote}
                />
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
});

Grid.displayName = "Grid";

export default Grid;