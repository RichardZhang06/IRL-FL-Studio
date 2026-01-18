// TopBar.tsx
type Props = {
  playing: boolean;
  bpm: number;
  onTogglePlay: () => void;
  onReset: () => void;
  onClearNotes: () => void;
  onBpmChange: (bpm: number) => void;
  onAdjustSteps: (delta: number) => void;
  numSteps: number;
  onSavePreset: () => void;
  onLoadPreset: () => void;
  showFretboard: boolean;
  onToggleFretboard: () => void;
};

export default function TopBar({
  playing,
  bpm,
  onTogglePlay,
  onReset,
  onClearNotes,
  onBpmChange,
  onAdjustSteps,
  numSteps,
  onSavePreset,
  onLoadPreset,
  showFretboard,
  onToggleFretboard,
}: Props) {
  return (
    <div className="topbar">
      {/* App title */}
      <div className="title">IRL FL Studio</div>
      
      <div className="transport">
        <button
          className={playing ? "stop" : "primary"}
          onClick={onTogglePlay}
        >
          {playing ? "Stop" : "Start"}
        </button>
        <button className="reset" onClick={onReset}>
          Reset
        </button>
        <button className="clear" onClick={onClearNotes}>
          Clear Notes
        </button>
      </div>
      
      <div className="bpm">
        <span>BPM</span>
        <input
          type="range"
          min={20}
          max={120}
          value={bpm}
          onChange={(e) => onBpmChange(Number(e.target.value))}
        />
        <span className="bpm-value">{bpm}</span>
      </div>
      
      {/* Grid Size Controls */}
      <div className="step-control">
        <button 
          className="step-btn step-down"
          onClick={() => onAdjustSteps(-16)}
        >
          -16
        </button>

        <span className="step-count">{numSteps} notes</span>

        <button 
          className="step-btn step-up"
          onClick={() => onAdjustSteps(16)}
        >
          +16
        </button>
      </div>

      {/* Presets */}
      <div style={{ display: "flex", gap: "8px" }}>
        <button onClick={onSavePreset}>Save Preset</button>
        <button onClick={onLoadPreset}>Load Preset</button>
      </div>

      {/* Fretboard Toggle */}
      <div style={{ display: "flex", gap: "8px" }}>
        <button 
          className={`fretboard-toggle ${showFretboard ? "on" : "off"}`}
          onClick={onToggleFretboard}
        >
          {showFretboard ? "Hide" : "Show"} Fretboard
        </button>
      </div>
    </div>
  );
}