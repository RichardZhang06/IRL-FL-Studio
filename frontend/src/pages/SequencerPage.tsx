import { useEffect, useState } from "react";
import SequencerGrid from "../components/SequencerGrid";

const STRINGS = 3;
const FRETS = 6;
const STEPS = 32;

const MIN_BPM = 60;
const MAX_BPM = 200;

function stepDurationMs(bpm: number) {
  return (60_000 / bpm) / 4; // 16th notes
}

function createEmptyGrid() {
  return Array.from({ length: STRINGS }, () =>
    Array.from({ length: FRETS }, () =>
      Array.from({ length: STEPS }, () => false)
    )
  );
}

export default function SequencerPage() {
  const [grid, setGrid] = useState<boolean[][][]>(() => createEmptyGrid());
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [bpm, setBpm] = useState(120);

  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setCurrentStep((prev) => (prev + 1) % STEPS);
    }, stepDurationMs(bpm));

    return () => clearInterval(interval);
  }, [isPlaying, bpm]);

  function handlePlay() {
    setCurrentStep(0);
    setIsPlaying(true);
  }

  function handleStop() {
    setIsPlaying(false);
    setCurrentStep(0);
  }

  return (
    <div className="h-screen bg-gray-900 text-gray-100 flex flex-col">
      {/* Header */}
      <header className="h-14 bg-gray-800 flex items-center px-4 border-b border-gray-700 gap-4">
        <h1 className="text-lg font-semibold text-purple-400">
          IRL FL Studio
        </h1>

        {/* BPM Control */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-300">BPM</span>
          <input
            type="range"
            min={MIN_BPM}
            max={MAX_BPM}
            value={bpm}
            onChange={(e) => setBpm(Number(e.target.value))}
            className="w-32"
          />
          <span className="w-10 text-sm text-gray-300">
            {bpm}
          </span>
        </div>

        {/* Transport */}
        <div className="flex gap-2">
          <button
            onClick={handlePlay}
            className="px-3 py-1 bg-green-600 hover:bg-green-500 rounded"
          >
            Play
          </button>
          <button
            onClick={handleStop}
            className="px-3 py-1 bg-gray-600 hover:bg-gray-500 rounded"
          >
            Stop
          </button>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 overflow-auto">
        <div className="flex min-h-full min-w-full items-center justify-center">
          <SequencerGrid
            grid={grid}
            setGrid={setGrid}
            currentStep={currentStep}
          />
        </div>
      </main>
    </div>
  );
}
