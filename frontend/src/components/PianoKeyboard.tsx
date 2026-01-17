// PianoKeyboard.tsx
import { CUSTOM_NOTES, BLACK_NOTES } from "../constants";

export default function PianoKeyboard() {
  return (
    <div className="keyboard">
      {CUSTOM_NOTES.map((note, idx) => {
        const isBlack = BLACK_NOTES.has(idx);

        return (
          <div
            key={note}
            className={`key-row ${isBlack ? "black" : "white"}`}
          >
            <span className="key-label">{note}</span>
          </div>
        );
      })}
    </div>
  );
}
