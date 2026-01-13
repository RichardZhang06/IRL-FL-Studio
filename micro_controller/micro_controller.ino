/*
 * IRL Studio - Teensy Guitar Controller
 * 
 * This skeleton receives commands from the Python backend and controls
 * the guitar hardware (solenoids for fretting, servos for plucking).
 * 
 * Fill in the TODO sections when you know your hardware setup!
 */

// ============================================================================
// TODO: DEFINE YOUR HARDWARE PINS
// ============================================================================
// Example:
// #define SOLENOID_STRING1_FRET0  2
// #define SOLENOID_STRING1_FRET1  3
// #define SERVO_PLUCK_PIN  20

// Your pin definitions go here:


// ============================================================================
// TODO: INCLUDE REQUIRED LIBRARIES
// ============================================================================
// Example:
// #include <Servo.h>

// Your includes go here:


// ============================================================================
// TODO: DECLARE GLOBAL HARDWARE OBJECTS
// ============================================================================
// Example:
// Servo pluckServo;

// Your hardware objects go here:


// ============================================================================
// NOTE STORAGE (No changes needed)
// ============================================================================
struct Note {
  String pitchName;  // e.g., "E", "G", "A", "C#"
  int step;          // Which time step (0, 4, 8, 12...)
  int bpm;           // Tempo
};

Note noteBuffer[100];  // Store up to 100 notes
int noteCount = 0;
bool isPlaying = false;


// ============================================================================
// SETUP - Runs once on startup
// ============================================================================
void setup() {
  // Initialize serial (DO NOT CHANGE - must match backend!)
  Serial.begin(115200);
  
  // TODO: Initialize your servo(s)
  // Example:
  // pluckServo.attach(SERVO_PLUCK_PIN);
  
  
  // TODO: Initialize all solenoid pins as OUTPUT
  // Example:
  // pinMode(SOLENOID_STRING1_FRET0, OUTPUT);
  // pinMode(SOLENOID_STRING1_FRET1, OUTPUT);
  // ... etc
  
  
  // Startup message
  Serial.println("🎸 Teensy Guitar Controller Ready!");
  Serial.println("Waiting for commands from backend...");
}


// ============================================================================
// MAIN LOOP - Runs forever
// ============================================================================
void loop() {
  // Check for incoming serial data from backend
  if (Serial.available() > 0) {
    String command = Serial.readStringUntil('\n');
    command.trim();
    
    parseCommand(command);
  }
  
  // Add any other continuous tasks here if needed
}


// ============================================================================
// COMMAND PARSING (No changes needed)
// ============================================================================
void parseCommand(String cmd) {
  Serial.print("📨 Received: ");
  Serial.println(cmd);
  
  // Parse NOTE command: "NOTE:E,0,120"
  if (cmd.startsWith("NOTE:")) {
    String data = cmd.substring(5);  // Remove "NOTE:" prefix
    
    // Split by commas
    int firstComma = data.indexOf(',');
    int secondComma = data.indexOf(',', firstComma + 1);
    
    String pitchName = data.substring(0, firstComma);
    int step = data.substring(firstComma + 1, secondComma).toInt();
    int bpm = data.substring(secondComma + 1).toInt();
    
    // Store note in buffer
    noteBuffer[noteCount].pitchName = pitchName;
    noteBuffer[noteCount].step = step;
    noteBuffer[noteCount].bpm = bpm;
    noteCount++;
    
    Serial.print("   Stored note #");
    Serial.print(noteCount);
    Serial.print(": ");
    Serial.print(pitchName);
    Serial.print(" at step ");
    Serial.print(step);
    Serial.print(", BPM ");
    Serial.println(bpm);
  }
  
  // Parse PLAY command
  else if (cmd == "PLAY") {
    Serial.println("▶️  Starting playback...");
    startPlayback();
  }
  
  // Parse STOP command
  else if (cmd == "STOP") {
    Serial.println("⏹️  Stopping playback...");
    stopPlayback();
  }
  
  // Unknown command
  else {
    Serial.print("❓ Unknown command: ");
    Serial.println(cmd);
  }
}


// ============================================================================
// PLAYBACK CONTROL
// ============================================================================
void startPlayback() {
  // Check if we have notes to play
  if (noteCount == 0) {
    Serial.println("❌ No notes to play!");
    return;
  }
  
  isPlaying = true;
  
  // Get BPM from first note (all notes should have same BPM)
  int bpm = noteBuffer[0].bpm;
  
  // Calculate timing: milliseconds per step
  // Formula: (60000 ms/min / BPM) / 4 steps per beat
  // At 120 BPM: (60000 / 120) / 4 = 125 ms per step
  float msPerStep = (60000.0 / bpm) / 4.0;
  
  Serial.print("🎵 Playing ");
  Serial.print(noteCount);
  Serial.print(" notes at ");
  Serial.print(bpm);
  Serial.print(" BPM (");
  Serial.print(msPerStep);
  Serial.println(" ms/step)");
  
  // Find the highest step number for timing
  int maxStep = 0;
  for (int i = 0; i < noteCount; i++) {
    if (noteBuffer[i].step > maxStep) {
      maxStep = noteBuffer[i].step;
    }
  }
  
  // Play through each step
  unsigned long startTime = millis();
  
  for (int currentStep = 0; currentStep <= maxStep; currentStep++) {
    // Check if stop was requested
    if (!isPlaying) {
      Serial.println("🛑 Playback stopped by user");
      break;
    }
    
    // Find and play all notes at this step
    bool notesAtThisStep = false;
    for (int i = 0; i < noteCount; i++) {
      if (noteBuffer[i].step == currentStep) {
        if (!notesAtThisStep) {
          Serial.print("   Step ");
          Serial.print(currentStep);
          Serial.println(":");
          notesAtThisStep = true;
        }
        playNote(noteBuffer[i].pitchName);
      }
    }
    
    // Wait until next step
    unsigned long targetTime = startTime + (unsigned long)(currentStep * msPerStep);
    while (millis() < targetTime) {
      // Check for stop command during wait
      if (Serial.available() > 0) {
        String cmd = Serial.readStringUntil('\n');
        cmd.trim();
        if (cmd == "STOP") {
          stopPlayback();
          return;
        }
      }
      // Small delay to prevent CPU hogging
      delay(1);
    }
  }
  
  Serial.println("✅ Playback complete!");
  isPlaying = false;
  noteCount = 0;  // Clear buffer for next play
}


void stopPlayback() {
  isPlaying = false;
  noteCount = 0;
  
  // Release all hardware
  releaseAllHardware();
  
  Serial.println("🛑 Stopped and released all hardware");
}


// ============================================================================
// NOTE PLAYBACK
// ============================================================================
void playNote(String pitchName) {
  Serial.print("      🎸 Playing: ");
  Serial.println(pitchName);
  
  // Step 1: Map note name to guitar position
  int stringNum, fretNum;
  mapNoteToPosition(pitchName, stringNum, fretNum);
  
  // Step 2: Press the fret (activate solenoid)
  pressFret(stringNum, fretNum);
  
  // Step 3: Wait for solenoid to fully press (tune this delay!)
  delay(50);
  
  // Step 4: Pluck the string (move servo)
  pluckString(stringNum);
  
  // Step 5: Let note ring (tune this delay!)
  delay(100);
  
  // Step 6: Release the fret (deactivate solenoid)
  releaseFret(stringNum, fretNum);
}


// ============================================================================
// TODO: NOTE MAPPING
// ============================================================================
void mapNoteToPosition(String noteName, int &stringNum, int &fretNum) {
  /*
   * Map note names to guitar string and fret positions.
   * 
   * Example for standard 3-string tuning (high to low):
   * String 1 (E4): E, F, F#, G, G#, A (frets 0-5)
   * String 2 (B3): B, C, C#, D, D#, E (frets 0-5)
   * String 3 (G3): G, G#, A, A#, B, C (frets 0-5)
   */
  
  // TODO: Fill in your note mapping
  // Example:
  // if (noteName == "E") {
  //   stringNum = 1;
  //   fretNum = 0;
  // }
  // else if (noteName == "F") {
  //   stringNum = 1;
  //   fretNum = 1;
  // }
  // ... etc
  
  // Default fallback (remove this when you add real mapping)
  Serial.println("         ⚠️  WARNING: Note mapping not implemented!");
  stringNum = 1;
  fretNum = 0;
  
  Serial.print("         → String ");
  Serial.print(stringNum);
  Serial.print(", Fret ");
  Serial.println(fretNum);
}


// ============================================================================
// TODO: FRETTING CONTROL (Solenoids)
// ============================================================================
void pressFret(int stringNum, int fretNum) {
  /*
   * Activate the solenoid to press down on the specified string/fret.
   * 
   * This turns on the appropriate solenoid to push the string down
   * against the fretboard.
   */
  
  // TODO: Implement solenoid control
  // Example:
  // int pin = getSolenoidPin(stringNum, fretNum);
  // digitalWrite(pin, HIGH);
  
  Serial.print("         🔌 Press fret (String ");
  Serial.print(stringNum);
  Serial.print(", Fret ");
  Serial.print(fretNum);
  Serial.println(")");
}


void releaseFret(int stringNum, int fretNum) {
  /*
   * Deactivate the solenoid to release the string.
   */
  
  // TODO: Implement solenoid release
  // Example:
  // int pin = getSolenoidPin(stringNum, fretNum);
  // digitalWrite(pin, LOW);
  
  Serial.print("         🔓 Release fret (String ");
  Serial.print(stringNum);
  Serial.print(", Fret ");
  Serial.print(fretNum);
  Serial.println(")");
}


void releaseAllHardware() {
  /*
   * Emergency release - turn off ALL solenoids and reset servos.
   * Called when stopping playback or on error.
   */
  
  // TODO: Turn off all solenoid pins
  // Example:
  // for (int pin = 2; pin <= 20; pin++) {
  //   digitalWrite(pin, LOW);
  // }
  
  // TODO: Reset servo(s) to rest position
  // Example:
  // pluckServo.write(0);
  
  Serial.println("         🔧 Released all hardware");
}


// ============================================================================
// TODO: PLUCKING CONTROL (Servo)
// ============================================================================
void pluckString(int stringNum) {
  /*
   * Move the servo to pluck/strum the specified string.
   * 
   * This could be:
   * - A single servo that sweeps across all strings
   * - One servo per string
   * - A rotating arm with a pick
   * - Whatever mechanism you design!
   */
  
  // TODO: Implement servo plucking
  // Example:
  // pluckServo.write(90);  // Move to pluck position
  // delay(50);
  // pluckServo.write(0);   // Return to rest
  
  Serial.print("         🎼 Pluck string ");
  Serial.println(stringNum);
}


// ============================================================================
// TODO: HELPER FUNCTIONS (Optional)
// ============================================================================

/*
 * Example helper function to map (string, fret) to pin number
 */
// int getSolenoidPin(int stringNum, int fretNum) {
//   // Example mapping:
//   // String 1: pins 2-7 (frets 0-5)
//   // String 2: pins 8-13 (frets 0-5)
//   // String 3: pins 14-19 (frets 0-5)
//   
//   int basePin = 2 + (stringNum - 1) * 6;
//   return basePin + fretNum;
// }

/*
 * Add any other helper functions you need here
 */
