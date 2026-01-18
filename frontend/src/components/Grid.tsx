// Grid.tsx
import { forwardRef, useState } from "react";
import { STEP_WIDTH, CUSTOM_NOTES, NOTE_GROUPS, CHORD_NOTES } from "../constants";
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
  activeNotes?: string[];
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
  const [contextMenu, setContextMenu] = useState<{x: number, y: number, step: number} | null>(null);

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

  const handleContextMenu = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    const grid = e.currentTarget;
    const rect = grid.getBoundingClientRect();
    const x = e.clientX - rect.left + grid.scrollLeft;
    const step = Math.floor(x / STEP_WIDTH);
    
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      step
    });
  };

  const handleAddChord = (chordName: string) => {
    if (!contextMenu) return;
    
    const chordNotes = CHORD_NOTES[chordName];
    if (chordNotes) {
      chordNotes.forEach(noteName => {
        if (CUSTOM_NOTES.includes(noteName)) {
          addNote(noteName, contextMenu.step);
        }
      });
    }
    setContextMenu(null);
  };

  const handleCloseMenu = () => {
    setContextMenu(null);
  };

  return (
    <>
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
        onContextMenu={handleContextMenu}
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
                    ? (isEvenRow ? "#2d3a4d" : "#28354d")
                    : isEvenRow 
                      ? "#2a2a2a" 
                      : "#252525",
                  backgroundImage: `linear-gradient(to right, #444 1px, transparent 1px)`,
                  backgroundSize: `${STEP_WIDTH}px 100%`,
                  transition: "background-color 0.15s ease",
                  boxShadow: isActive ? "inset 0 0 15px rgba(90, 157, 232, 0.12)" : "none",
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

      {/* Context Menu */}
      {contextMenu && (
        <>
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 999,
            }}
            onClick={handleCloseMenu}
          />
          <div
            style={{
              position: "fixed",
              left: contextMenu.x,
              top: contextMenu.y,
              background: "#2a2a2a",
              border: "1px solid #444",
              borderRadius: 6,
              padding: "8px 0",
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.5)",
              zIndex: 1000,
              minWidth: 150,
            }}
          >
            <div style={{ padding: "4px 12px", color: "#999", fontSize: 12, fontWeight: 600 }}>
              Add Chord
            </div>
            {Object.keys(CHORD_NOTES).map(chordName => (
              <div
                key={chordName}
                onClick={() => handleAddChord(chordName)}
                style={{
                  padding: "8px 16px",
                  color: "#fff",
                  cursor: "pointer",
                  transition: "background 0.1s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(110, 166, 229, 0.3)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                }}
              >
                {chordName} Major
              </div>
            ))}
          </div>
        </>
      )}
    </>
  );
});

Grid.displayName = "Grid";
export default Grid;