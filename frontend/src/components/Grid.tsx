// Grid.tsx
import { STEP_WIDTH, CUSTOM_NOTES } from "../constants";
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
  hoveredRow: number | null;
  setHoveredRow: (row: number | null) => void;
};

export default function Grid({
  notes,
  addNote,
  deleteNote,
  playheadX,
  hoveredRow,
  setHoveredRow,
}: GridProps) {
  const numRows = CUSTOM_NOTES.length;

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
          display: "grid",
          gridTemplateRows: `repeat(${numRows}, 1fr)`,
          gridAutoColumns: `${STEP_WIDTH}px`,
        }}
      >
        {CUSTOM_NOTES.map((noteName, rowIndex) => {
          const rowNotes = notes.filter((n) => n.pitchName === noteName);

          return (
            <div
              key={noteName}
              className="grid-row"
              onMouseEnter={() => setHoveredRow(rowIndex)}
              onMouseLeave={() => setHoveredRow(null)}
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
