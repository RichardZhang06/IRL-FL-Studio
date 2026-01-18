// Fretboard.tsx
import { STRINGS, FRETS, GUITAR_NOTE_MAP } from "../constants";

type FretboardProps = {
  visible: boolean;
  activeNotes?: string[];
};

export default function Fretboard({ visible, activeNotes = [] }: FretboardProps) {
  if (!visible) return null;
  
  const activePositions = activeNotes
    .map(note => {
        const positions = GUITAR_NOTE_MAP[note];
        return positions ? positions[0] : null;
    })
    .filter(pos => pos !== null);
    
  return (
    <div style={{
      position: "absolute",
      right: 0,
      top: 0,
      bottom: 0,
      width: 300,
      background: "rgba(40, 30, 20, 0.5)",
      backdropFilter: "blur(4px)",
      zIndex: 20,
      padding: "25px 25px",
      pointerEvents: "none",
    }}>
      <div style={{
        fontSize: 16,
        fontWeight: 700,
        color: "#fff",
        marginBottom: 15,
        textAlign: "center",
        pointerEvents: "auto",
      }}>
        Guitar Fretboard
      </div>
      
      <div style={{
        position: "relative",
        height: "calc(100% - 40px)",
        width: "100%",
      }}>
        {/* Strings (vertical columns) */}
        {Array.from({ length: STRINGS }).map((_, stringIdx) => {
          const stringLeft = (stringIdx / (STRINGS - 1)) * 100;
          return (
            <div
              key={stringIdx}
              style={{
                position: "absolute",
                left: `${stringLeft}%`,
                top: 20,
                bottom: 20,
                width: 2 + stringIdx * 0.3,
                background: "#c0c0c0",
                transform: "translateX(-50%)",
                zIndex: 1,
              }}
            />
          );
        })}
        
        {/* Fret markers (horizontal rows) */}
        <div style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 20,
          bottom: 20,
          display: "flex",
          flexDirection: "column",
          pointerEvents: "auto",
        }}>
          {Array.from({ length: FRETS + 1 }).map((_, fretIdx) => (
            <div
              key={fretIdx}
              style={{
                flex: 1,
                borderBottom: fretIdx === 0 ? "4px solid #d4af37" : "2px solid #888",
                position: "relative",
              }}
            />
          ))} 
        </div>
        
        {/* Finger positions for active notes */}
        {activePositions.map((pos, idx) => {
          const stringWidth = 100 / (STRINGS - 1);
          const fretboardHeight = 260; // Approximate available height
          const fretHeightPx = fretboardHeight / (FRETS + 1);
          const topPos = 20 + (pos.fret * fretHeightPx) + (fretHeightPx / 2);
          
          return (
            <div
              key={idx}
              style={{
                position: "absolute",
                left: `${pos.string * stringWidth}%`,
                top: `${topPos}px`,
                width: 20,
                height: 20,
                borderRadius: "50%",
                background: "#7dff9b",
                border: "2px solid #fff",
                transform: "translate(-50%, -50%)",
                zIndex: 10,
                boxShadow: "0 0 10px rgba(125, 255, 155, 0.8)",
                pointerEvents: "auto",
              }}
            />
          );
        })}
      </div>
    </div>
  );
}