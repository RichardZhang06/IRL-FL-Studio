// Fretboard.tsx
import { STRINGS, FRETS, GUITAR_NOTE_MAP, NOTE_GROUPS } from "../constants";

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

  // Determine which strings have active notes
  const activeStrings = new Set(activePositions.map(pos => pos.string));
  
  // Create array of all strings with their status
  const stringStatuses = Array.from({ length: STRINGS }).map((_, stringIdx) => {
    const activePos = activePositions.find(pos => pos.string === stringIdx);
    if (activePos) {
      return { string: stringIdx, state: activePos.state };
    } else {
      // No active note for this string, show X
      return { string: stringIdx, state: -1 };
    }
  });
    
  return (
    <div style={{
      position: "absolute",
      right: 0,
      top: 0,
      bottom: 0,
      width: 300,
      background: "rgba(40, 30, 20, 0.5)",
      backdropFilter: "blur(4px)",
      borderLeft: "2px solid #654321",
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
        {/* String status indicators (O or X) at top */}
        {stringStatuses.map((status, idx) => {
          if (status.state !== 0 && status.state !== -1) return null;
          
          const stringWidth = 100 / (STRINGS - 1);
          return (
            <div
              key={`indicator-${idx}`}
              style={{
                position: "absolute",
                left: `${status.string * stringWidth}%`,
                top: 25,
                transform: "translate(-50%, -50%)",
                fontSize: 30,
                fontWeight: 700,
                color: "#fff",
                zIndex: 10,
                pointerEvents: "auto",
              }}
            >
              {status.state === 0 ? "O" : "X"}
            </div>
          );
        })}
        
        {/* Strings (vertical columns) */}
        {Array.from({ length: STRINGS }).map((_, stringIdx) => {
          const stringLeft = (stringIdx / (STRINGS - 1)) * 100;
          return (
            <div
              key={stringIdx}
              style={{
                position: "absolute",
                left: `${stringLeft}%`,
                top: 50,
                height: `calc(100% - 66px)`,
                width: 2 + stringIdx * 0.3,
                background: "#c0c0c0",
                transform: "translateX(-50%)",
                zIndex: 1,
              }}
            />
          );
        })}
        
        {/* Fret markers */}
        <div style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 50,
          height: `calc(100% - 70px)`,
          display: "flex",
          flexDirection: "column",
          pointerEvents: "auto",
          borderTop: "4px solid #d4af37", 
        }}>
          {Array.from({ length: FRETS }).map((_, fretIdx) => (
            <div
              key={fretIdx}
              style={{
                flex: 1,
                borderBottom: "2px solid #888",
                position: "relative",
              }}
            />
          ))} 
        </div>
        
        {/* Finger positions for active notes (state 1-4) */}
        {activePositions.map((pos, idx) => {
          if (pos.state < 1) return null;
          
          const stringWidth = 100 / (STRINGS - 1);
          
          const fretSpacePercent = 100 / FRETS;
          const topPercent = (pos.state - 0.5) * fretSpacePercent;
          
          return (
            <div
              key={`dot-${idx}`}
              style={{
                position: "absolute",
                left: `${pos.string * stringWidth}%`,
                top: `calc(50px + (100% - 70px) * ${topPercent / 100})`,
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