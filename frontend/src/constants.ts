// constants.ts

export const NOTE_HEIGHT = 40;
export const STEP_WIDTH = 32;
export const NUM_STEPS = 64;

// MIDI pitch range for exactly 12 notes (one octave)
export const MIN_PITCH = 57;  // A
export const MAX_PITCH = 68;  // A (next octave)
export const NUM_PITCHES = MAX_PITCH - MIN_PITCH + 1; // 12

// Custom 12-note sequence
export const CUSTOM_NOTES = [
  "A0", "B♭", "B", "C", "C#", "D", "E", "F", "F#", "G", "A♭", "A1" 
];

// Indices of black keys in CUSTOM_NOTES
export const BLACK_NOTES = new Set([1, 4, 8, 10]);
