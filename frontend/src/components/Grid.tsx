// Grid.tsx
import { STEP_WIDTH, CUSTOM_NOTES, NUM_STEPS } from "../constants";
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
};

export default function Grid({
  notes,
  addNote,
  deleteNote,
  playheadX,
}: GridProps) {
  const numRows = CUSTOM_NOTES.length;
  const gridWidth = NUM_STEPS * STEP_WIDTH;

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const grid = e.currentTarget;
    const rect = grid.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const step = Math.floor(x / STEP_WIDTH);
    const rowHeight = rect.height / numRows;
    const rowIndex = Math.floor(y / rowHeight);
    const pitchName = CUSTOM_NOTES[rowIndex];

    addNote(pitchName, step);
  };

  return (
    <div
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

          return (
            <div
              key={noteName}
              className="grid-row"
              style={{
                position: "relative",
                width: "100%",
                height: "100%",
                backgroundColor: isEvenRow ? "#2a2a2a" : "#252525",
                backgroundImage: `linear-gradient(to right, #444 1px, transparent 1px)`,
                backgroundSize: `${STEP_WIDTH}px 100%`,
              }}
            >
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
}
