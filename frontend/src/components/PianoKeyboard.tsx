// PianoKeyboard.tsx
import { CUSTOM_NOTES, BLACK_NOTES } from "../constants";

type PianoKeyboardProps = {
  activeNotes?: string[];
};

export default function PianoKeyboard({ activeNotes = [] }: PianoKeyboardProps) {
  return (
    <div className="keyboard">
      {CUSTOM_NOTES.map((note, idx) => {
        const isBlack = BLACK_NOTES.has(idx);
        const isActive = activeNotes.includes(note);
        
        return (
          <div
            key={note}
            className={`key-row ${isBlack ? "black" : "white"}`}
            style={{
              backgroundColor: isActive 
                ? (isBlack ? "#2d323a" : "#d8dce4")
                : undefined,
              transition: "background-color 0.15s ease",
              boxShadow: isActive 
                ? "inset 0 0 10px rgba(45, 50, 58, 0.3)" 
                : undefined,
            }}
          >
            <span className="key-label">{note}</span>
          </div>
        );
      })}
    </div>
  );
}