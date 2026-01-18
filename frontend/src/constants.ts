// constants.ts
export const STRINGS = 6;
export const FRETS = 4;
export const MIN_NOTES = 64;

export const STEP_WIDTH = 32;
export const NUM_STEPS = 64;

export const BEATS_AHEAD = 4;

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

// Common chord definitions (major chords)
export const CHORD_NOTES: Record<string, string[]> = {
  C: ['C3', 'E3', 'G3', 'C4', 'E4'],
  A: ['A2', 'E3', 'A3', 'C#4', 'E4'],
  G: ['G2', 'B2', 'D3', 'G3', 'C4', 'G4'],
  E: ['E2', 'B2', 'E3', 'A♭3', 'B3', 'E4'],
  D: ['D3', 'A3', 'D4', 'F#4'],
};

// Helper function to find which group a note belongs to
export const findNoteGroup = (pitchName: string): string[] | null => {
  return NOTE_GROUPS.find(group => group.includes(pitchName)) || null;
};

// Indices of black keys in CUSTOM_NOTES
export const BLACK_NOTES = new Set([0, 2, 5, 7, 10, 12, 14, 17, 19, 22, 24, 26]);

// Guitar standard tuning (low to high): E A D G B E
// state: -1 = X (muted), 0 = O (open), 1 = fret 1, 2 = fret 2, 3 = fret 3, 4 = fret 4
export const GUITAR_NOTE_MAP: { [key: string]: { string: number; state: number }[] } = {
  "E2": [{ string: 0, state: 0 }],
  "F2": [{ string: 0, state: 1 }],
  "F#2": [{ string: 0, state: 2 }],
  "G2": [{ string: 0, state: 3 }],
  "A♭2": [{ string: 0, state: 4 }],
  "A2": [{ string: 1, state: 0 }],
  "B♭2": [{ string: 1, state: 1 }],
  "B2": [{ string: 1, state: 2 }],
  "C3": [{ string: 1, state: 3 }],
  "C#3": [{ string: 1, state: 4 }],
  "D3": [{ string: 2, state: 0 }],
  "E♭3": [{ string: 2, state: 1 }],
  "E3": [{ string: 2, state: 2 }],
  "F3": [{ string: 2, state: 3 }],
  "F#3": [{ string: 2, state: 4 }],
  "G3": [{ string: 3, state: 0 }],
  "A♭3": [{ string: 3, state: 1 }],
  "A3": [{ string: 3, state: 2 }],
  "B♭3": [{ string: 3, state: 3 }],
  "B3": [{ string: 4, state: 0 }],
  "C4": [{ string: 4, state: 1 }],
  "C#4": [{ string: 4, state: 2 }],
  "D4": [{ string: 4, state: 3 }],
  "E♭4": [{ string: 4, state: 4 }],
  "E4": [{ string: 5, state: 0 }],
  "F4": [{ string: 5, state: 1 }],
  "F#4": [{ string: 5, state: 2 }],
  "G4": [{ string: 5, state: 3 }],
  "A♭4": [{ string: 5, state: 4 }],
};