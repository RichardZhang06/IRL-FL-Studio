// constants.ts

export const STEP_WIDTH = 32;
export const NUM_STEPS = 64;

// MIDI pitch range for exactly 12 notes (one octave)
export const BEATS_AHEAD = 4;

// Custom 12-note sequence
export const CUSTOM_NOTES = [
  "A♭4", "G4", "F#4", "F4", "E4", "E♭4", "D4", "C#4", "C4", "B3", "B♭3", "A3", "A♭3", "G3", "F#3", "F3", "E3", "E♭3", "D3", "C#3", "C3", "B2", "B♭2", "A2", "A♭2", "G2", "F#2", "F2", "E2" 
];

export const NOTE_GROUPS = [
  ["A♭4", "G4", "F#4", "F4", "E4"],
  ["E♭4", "D4", "C#4", "C4", "B3"],
  ["B♭3", "A3", "A♭3", "G3"],
  ["F#3", "F3", "E3", "E♭3", "D3"],
  ["C#3", "C3", "B2", "B♭2", "A2"],
  ["A♭2", "G2", "F#2", "F2", "E2"]
]

// Helper function to find which group a note belongs to
export const findNoteGroup = (pitchName: string): string[] | null => {
  return NOTE_GROUPS.find(group => group.includes(pitchName)) || null;
};

// Indices of black keys in CUSTOM_NOTES
export const BLACK_NOTES = new Set([0, 2, 5, 7, 10, 12, 14, 17, 19, 22, 24, 26]);
