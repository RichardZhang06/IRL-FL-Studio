import React from "react";

type Props = {
  grid: boolean[][][];
  setGrid: React.Dispatch<React.SetStateAction<boolean[][][]>>;
  currentStep: number;
};

export default function SequencerGrid({
  grid,
  setGrid,
  currentStep,
}: Props) {
  const steps = grid[0]?.[0]?.length ?? 0;

  function toggleCell(stringIdx: number, fretIdx: number, stepIdx: number) {
    setGrid((prev) => {
      const next = structuredClone(prev);
      next[stringIdx][fretIdx][stepIdx] = !next[stringIdx][fretIdx][stepIdx];
      return next;
    });
  }

  return (
    <div className="flex flex-col items-center p-8">
      <div className="flex flex-col">
        {/* Time axis */}
        <div 
          className="grid sticky top-0 z-10 py-2 border-b border-gray-700" 
          style={{ gridTemplateColumns: `6rem repeat(${steps}, 2.5rem)` }}
        >
          <div /> {/* top-left corner */}
          {Array.from({ length: steps }).map((_, step) => (
            <div
              key={step}
              className={`text-center text-xs ${
                step === currentStep ? "text-purple-400 font-bold" : "text-gray-400"
              }`}
            >
              {step + 1}
            </div>
          ))}
        </div>

        {/* Grid rows */}
        <div className="flex flex-col gap-1">
          {grid.map((stringRow, stringIdx) =>
            stringRow.map((fretRow, fretIdx) => (
              <div
                key={`${stringIdx}-${fretIdx}`}
                className="grid items-center"
                style={{ gridTemplateColumns: `6rem repeat(${steps}, 2.5rem)` }}
              >
                {/* Row label */}
                <div className="text-sm text-gray-400">{`String ${stringIdx + 1} Fret ${fretIdx}`}</div>

                {/* Steps */}
                {fretRow.map((active, stepIdx) => {
                  const isPlayhead = stepIdx === currentStep;
                  return (
                    <div
                      key={stepIdx}
                      onClick={() => toggleCell(stringIdx, fretIdx, stepIdx)}
                      className={`
                        flex-1
                        aspect-square
                        min-h-[2rem]
                        border
                        cursor-pointer
                        transition-colors
                        ${active ? "bg-purple-500" : "bg-gray-800 hover:bg-gray-700"}
                        ${isPlayhead ? "border-yellow-400" : "border-gray-700"}
                      `}
                    />
                  );
                })}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
