// PianoKeyboard.tsx
import { CUSTOM_NOTES, BLACK_NOTES } from "../constants";

export default function PianoKeyboard() {
  return (
    <div
      className="keyboard"
      style={{
        width: "100px",
        height: "100%", 
        display: "flex",
        flexDirection: "column",
      }}
    >
      {CUSTOM_NOTES.map((note, idx) => {
        const isBlack = BLACK_NOTES.has(idx);

        return (
          <div
            key={note}
            className={`key-row ${isBlack ? "black" : "white"}`}
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <span className="key-label">{note}</span>
          </div>
        );
      })}
    </div>
  );
}
