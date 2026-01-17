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
          min={40}
          max={240}
          value={bpm}
          onChange={(e) => onBpmChange(Number(e.target.value))}
        />
        <span className="bpm-value">{bpm}</span>
      </div>

      {/* Grid Size Controls */}
      <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
        <button onClick={() => onAdjustSteps(-16)}>-16 Steps</button>
        <span style={{ fontWeight: 600, minWidth: "80px", textAlign: "center" }}>
          {numSteps} steps
        </span>
        <button onClick={() => onAdjustSteps(16)}>+16 Steps</button>
      </div>
    </div>
  );
}
