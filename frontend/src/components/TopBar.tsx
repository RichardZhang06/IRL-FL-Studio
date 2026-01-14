// TopBar.tsx
type Props = {
  playing: boolean;
  bpm: number;
  onTogglePlay: () => void;
  onReset: () => void;
  onBpmChange: (bpm: number) => void;
};

export default function TopBar({
  playing,
  bpm,
  onTogglePlay,
  onReset,
  onBpmChange,
}: Props) {
  return (
    <div className="topbar">
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
    </div>
  );
}
