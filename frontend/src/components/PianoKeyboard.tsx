// PianoKeyboard.tsx
import { CUSTOM_NOTES, BLACK_NOTES } from "../constants";

type Props = {
  hoveredRow: number | null;
};

export default function PianoKeyboard({ hoveredRow }: Props) {
  return (
    <div className="keyboard">
      {CUSTOM_NOTES.map((note, idx) => {
        const isBlack = BLACK_NOTES.has(idx);
        const isActive = hoveredRow === idx;

        return (
          <div
            key={note}
            className={`key-row ${isBlack ? "black" : "white"} ${isActive ? "active" : ""}`}
          >
            <span className="key-label">{note}</span>
          </div>
        );
      })}
    </div>
  );
}
