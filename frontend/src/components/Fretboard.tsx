// Fretboard.tsx
import { STRINGS, FRETS, GUITAR_NOTE_MAP } from "../constants";

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
      zIndex: 20,
      padding: "25px",
      pointerEvents: "none",
      transition: "right 0.1s ease-out",
    }}>
      <div style={{
        fontSize: 28,
        fontWeight: 700,
        background: "linear-gradient(135deg, #d4af37 0%, #f4d03f 50%, #d4af37 100%)",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
        backgroundClip: "text",
        marginBottom: 15,
        textAlign: "center",
        filter: "drop-shadow(0 2px 4px rgba(212, 175, 55, 0.5))",
        letterSpacing: "1px",
        textTransform: "uppercase",
      }}>
        Guitar Fretboard
      </div>
      
      <div style={{
        position: "relative",
        height: "calc(100% - 40px)",
        width: "100%",
      }}>
        {/* String status indicators (X for muted, circles for open) */}
        {stringStatuses.map((status) => {
        const isMuted = status.state === -1;
        const isOpen = status.state === 0;
  
        // Only show indicators for muted or open strings
        if (!isMuted && !isOpen) return null;
  
        // Find the note name for open strings
        const noteName = isOpen ? activeNotes.find(note => {
            const pos = GUITAR_NOTE_MAP[note]?.[0];
            return pos && pos.string === status.string && pos.state === 0;
        }) : null;
  
        // Don't show open string indicator if no note is playing
        if (isOpen && !noteName) return null;
  
        return (
            <div
            key={`indicator-${status.string}`}
            style={{
                position: "absolute",
                left: `${getStringLeft(status.string)}%`,
                top: INDICATOR_TOP,
                transform: "translate(-50%, -50%)",
                width: isMuted ? "auto" : 40,
                height: isMuted ? "auto" : 40,
                borderRadius: isMuted ? "0" : "50%",
                background: isMuted ? "transparent" : "rgba(110, 166, 229, 0.8)",
                border: isMuted ? "none" : "2px solid #fff",
                zIndex: 10,
                boxShadow: isMuted ? "none" : "0 0 10px rgba(110, 166, 229, 0.8)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: isMuted ? 36 : 14,
                fontWeight: 700,
                color: isMuted ? "#ff6b6b" : "#1a1a1a",
                textShadow: isMuted ? "0 0 12px rgba(255, 107, 107, 0.8)" : "none",
            }}
            >
            {isMuted ? "x" : noteName}
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

          // Find the note name for this position
          const noteName = activeNotes.find(note => {
              const pos = GUITAR_NOTE_MAP[note]?.[0];
              return pos && pos.string === status.string && pos.state === status.state;
          });
          
          return (
            <div
              key={`dot-${status.string}`}
              style={{
                position: "absolute",
                left: `${getStringLeft(status.string)}%`,
                top: getDotTop(status.state),
                width: 40,
                height: 40,
                borderRadius: "50%",
                background: "rgba(110, 166, 229, 0.8)",
                border: "2px solid #fff",
                transform: "translate(-50%, -50%)",
                zIndex: 10,
                boxShadow: "0 0 10px rgba(110, 166, 229, 0.8)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 14,
                fontWeight: 700,
                color: "#1a1a1a",
              }}
            >
              {noteName}
            </div>
          );
        })}
      </div>
    </div>
  );
}