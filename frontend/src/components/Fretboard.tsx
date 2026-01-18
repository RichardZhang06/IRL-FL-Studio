// Fretboard.tsx
import { STRINGS, FRETS, GUITAR_NOTE_MAP, NOTE_GROUPS } from "../constants";

type FretboardProps = {
  visible: boolean;
  activeNotes?: string[];
  playheadX?: number;
  gridWidth?: number;
};

export default function Fretboard({ visible, activeNotes = [], playheadX = 0, gridWidth = 0 }: FretboardProps) {
  if (!visible) return null;
  
  // Constants for layout
  const FRETBOARD_WIDTH = 300;
  const FRETBOARD_TOP = 50;
  const FRETBOARD_BOTTOM = 50; // Changed from 70 to 50
  const INDICATOR_TOP = 25;
  
  // Calculate horizontal offset to push fretboard off-screen when playhead is at the right
  const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1920;
  const rightOffset = Math.max(0, playheadX - (viewportWidth - FRETBOARD_WIDTH));
  
  // Get positions for all active notes
  const activePositions = activeNotes
    .map(note => GUITAR_NOTE_MAP[note]?.[0])
    .filter(pos => pos !== null);
  
  // Determine status for each string (X if no active note, otherwise the position)
  const stringStatuses = Array.from({ length: STRINGS }, (_, stringIdx) => {
    const activePos = activePositions.find(pos => pos.string === stringIdx);
    return activePos || { string: stringIdx, state: -1 };
  });
  
  // Calculate string horizontal position
  const getStringLeft = (stringIdx: number) => 
    (stringIdx / (STRINGS - 1)) * 100;
  
  // Calculate dot vertical position (centered in fret space)
  const getDotTop = (state: number) => {
    const fretSpacePercent = (state - 0.5) / FRETS;
    return `calc(${FRETBOARD_TOP}px + (100% - ${FRETBOARD_BOTTOM}px) * ${fretSpacePercent})`;
  };
    
  return (
    <div style={{
      position: "absolute",
      right: -rightOffset,
      top: 0,
      bottom: 0,
      width: FRETBOARD_WIDTH,
      background: "rgba(40, 30, 20, 0.5)",
      backdropFilter: "blur(4px)",
      borderLeft: "2px solid #654321",
      zIndex: 20,
      padding: "25px",
      pointerEvents: "none",
      transition: "right 0.1s ease-out",
    }}>
      <div style={{
        fontSize: 30,
        fontWeight: 700,
        color: "#fff",
        marginBottom: 15,
        textAlign: "center",
      }}>
        Guitar Fretboard
      </div>
      
      <div style={{
        position: "relative",
        height: "calc(100% - 40px)",
        width: "100%",
      }}>
        {/* String status indicators (O or X) */}
        {stringStatuses.map((status) => {
          if (status.state > 0) return null;
          
          return (
            <div
              key={`indicator-${status.string}`}
              style={{
                position: "absolute",
                left: `${getStringLeft(status.string)}%`,
                top: INDICATOR_TOP,
                transform: "translate(-50%, -50%)",
                fontSize: 30,
                fontWeight: 700,
                color: "#fff",
                zIndex: 10,
              }}
            >
              {status.state === 0 ? "O" : "X"}
            </div>
          );
        })}
        
        {/* Strings (vertical columns) */}
        {Array.from({ length: STRINGS }, (_, stringIdx) => (
          <div
            key={`string-${stringIdx}`}
            style={{
              position: "absolute",
              left: `${getStringLeft(stringIdx)}%`,
              top: FRETBOARD_TOP,
              height: `calc(100% - ${FRETBOARD_BOTTOM}px)`,
              width: 2 + stringIdx * 0.7,
              background: "#c0c0c0",
              transform: "translateX(-50%)",
              zIndex: 1,
            }}
          />
        ))}
        
        {/* Fret markers (horizontal rows) */}
        <div style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: FRETBOARD_TOP,
          height: `calc(100% - ${FRETBOARD_BOTTOM}px)`,
          display: "flex",
          flexDirection: "column",
          borderTop: "4px solid #d4af37",
        }}>
          {Array.from({ length: FRETS }, (_, fretIdx) => (
            <div
              key={`fret-${fretIdx}`}
              style={{
                flex: 1,
                borderBottom: "2px solid #888",
              }}
            />
          ))}
        </div>
        
        {/* Finger positions (green dots for state 1-4) */}
        {stringStatuses.map((status) => {
          if (status.state < 1) return null;
          
          return (
            <div
              key={`dot-${status.string}`}
              style={{
                position: "absolute",
                left: `${getStringLeft(status.string)}%`,
                top: getDotTop(status.state),
                width: 20,
                height: 20,
                borderRadius: "50%",
                background: "#7dff9b",
                border: "2px solid #fff",
                transform: "translate(-50%, -50%)",
                zIndex: 10,
                boxShadow: "0 0 10px rgba(125, 255, 155, 0.8)",
              }}
            />
          );
        })}
      </div>
    </div>
  );
}