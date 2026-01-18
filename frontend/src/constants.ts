// constants.ts

export const STRINGS = 6;
export const FRETS = 4;

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

// Guitar standard tuning (low to high)
export const GUITAR_NOTE_MAP: { [key: string]: { string: number; fret: number }[] } = {
  "E2": [{ string: 0, fret: 0 }],
  "F2": [{ string: 0, fret: 1 }],
  "F#2": [{ string: 0, fret: 2 }],
  "G2": [{ string: 0, fret: 3 }],
  "A♭2": [{ string: 0, fret: 4 }],
  "A2": [{ string: 0, fret: 5 }, { string: 1, fret: 0 }],
  "B♭2": [{ string: 0, fret: 6 }, { string: 1, fret: 1 }],
  "B2": [{ string: 0, fret: 7 }, { string: 1, fret: 2 }],
  "C3": [{ string: 0, fret: 8 }, { string: 1, fret: 3 }],
  "C#3": [{ string: 0, fret: 9 }, { string: 1, fret: 4 }],
  "D3": [{ string: 0, fret: 10 }, { string: 1, fret: 5 }, { string: 2, fret: 0 }],
  "E♭3": [{ string: 0, fret: 11 }, { string: 1, fret: 6 }, { string: 2, fret: 1 }],
  "E3": [{ string: 0, fret: 12 }, { string: 1, fret: 7 }, { string: 2, fret: 2 }],
  "F3": [{ string: 1, fret: 8 }, { string: 2, fret: 3 }],
  "F#3": [{ string: 1, fret: 9 }, { string: 2, fret: 4 }],
  "G3": [{ string: 1, fret: 10 }, { string: 2, fret: 5 }, { string: 3, fret: 0 }],
  "A♭3": [{ string: 1, fret: 11 }, { string: 2, fret: 6 }, { string: 3, fret: 1 }],
  "A3": [{ string: 1, fret: 12 }, { string: 2, fret: 7 }, { string: 3, fret: 2 }],
  "B♭3": [{ string: 2, fret: 8 }, { string: 3, fret: 3 }],
  "B3": [{ string: 2, fret: 9 }, { string: 3, fret: 4 }, { string: 4, fret: 0 }],
  "C4": [{ string: 2, fret: 10 }, { string: 3, fret: 5 }, { string: 4, fret: 1 }],
  "C#4": [{ string: 2, fret: 11 }, { string: 3, fret: 6 }, { string: 4, fret: 2 }],
  "D4": [{ string: 2, fret: 12 }, { string: 3, fret: 7 }, { string: 4, fret: 3 }],
  "E♭4": [{ string: 3, fret: 8 }, { string: 4, fret: 4 }],
  "E4": [{ string: 3, fret: 9 }, { string: 4, fret: 5 }, { string: 5, fret: 0 }],
  "F4": [{ string: 3, fret: 10 }, { string: 4, fret: 6 }, { string: 5, fret: 1 }],
  "F#4": [{ string: 3, fret: 11 }, { string: 4, fret: 7 }, { string: 5, fret: 2 }],
  "G4": [{ string: 3, fret: 12 }, { string: 4, fret: 8 }, { string: 5, fret: 3 }],
  "A♭4": [{ string: 4, fret: 9 }, { string: 5, fret: 4 }],
};