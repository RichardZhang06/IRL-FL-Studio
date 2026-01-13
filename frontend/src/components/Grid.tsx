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
  updateNote: (id: number, newStep: number) => void;
  deleteNote: (id: number) => void;
};

export default function Grid({ notes, addNote, updateNote, deleteNote }: GridProps) {
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
        display: "grid",
        gridTemplateRows: `repeat(${numRows}, 1fr)`,
        gridAutoColumns: `${STEP_WIDTH}px`,
        overflow: "auto",
        position: "relative",
      }}
      onClick={handleClick}
    >
      {CUSTOM_NOTES.map((noteName) => {
        const rowNotes = notes.filter((n) => n.pitchName === noteName);

        return (
          <div
            key={noteName}
            className="grid-row"
            style={{ position: "relative", width: "100%", height: "100%" }}
          >
            {rowNotes.map((note) => (
              <NoteBlock
                key={note.id}
                note={note}
                onMove={updateNote}
                onDelete={deleteNote}
              />
            ))}
          </div>
        );
      })}
    </div>
  );
}
