// Fretboard.tsx
type FretboardProps = {
  visible: boolean;
};

export default function Fretboard({ visible }: FretboardProps) {
  const strings = 6;
  const frets = 4;
  
  if (!visible) return null;
  
  return (
    <div style={{
      position: "absolute",
      right: 0,
      top: 0,
      bottom: 0,
      width: 300,
      background: "rgba(40, 30, 20, 0.85)",
      backdropFilter: "blur(4px)",
      borderLeft: "2px solid #654321",
      zIndex: 20,
      padding: "20px 10px",
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
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
      }}>
        {/* Fret markers */}
        <div style={{
          position: "absolute",
          top: 0,
          left: 20,
          right: 20,
          bottom: 0,
          display: "flex",
          pointerEvents: "auto",
        }}>
          {Array.from({ length: frets + 1 }).map((_, fretIdx) => (
            <div
              key={fretIdx}
              style={{
                flex: 1,
                borderRight: fretIdx === 0 ? "4px solid #d4af37" : "2px solid #888",
                position: "relative",
              }}
            >
              {/* Fret dots at 3, 5, 7, 9, 12 */}
              {[3, 5, 7, 9].includes(fretIdx) && (
                <div style={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: "#888",
                }} />
              )}
              {fretIdx === 12 && (
                <>
                  <div style={{
                    position: "absolute",
                    top: "35%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: "#888",
                  }} />
                  <div style={{
                    position: "absolute",
                    top: "65%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: "#888",
                  }} />
                </>
              )}
            </div>
          ))}
        </div>

        {/* Strings */}
        {Array.from({ length: strings }).map((_, stringIdx) => (
          <div
            key={stringIdx}
            style={{
              position: "relative",
              height: 2 + stringIdx * 0.3,
              background: "#c0c0c0",
              borderRadius: 1,
              zIndex: 1,
            }}
          />
        ))}
      </div>
    </div>
  );
}