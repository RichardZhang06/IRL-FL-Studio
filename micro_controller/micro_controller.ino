/*
 * IRL Studio - Teensy Guitar Controller
 * REAL-TIME VERSION - Plays notes immediately when received
 * 
 * Backend handles timing, Teensy just executes commands immediately.
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
// STATE
// ============================================================================
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
  Serial.println("Mode: REAL-TIME (plays notes immediately)");
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
// COMMAND PARSING
// ============================================================================
void parseCommand(String cmd) {
  Serial.print("📨 Received: ");
  Serial.println(cmd);
  
  // Parse NOTE command: "NOTE:C4,0,120"
  // This means: Play C4 RIGHT NOW (backend handles timing!)
  if (cmd.startsWith("NOTE:")) {
    String data = cmd.substring(5);  // Remove "NOTE:" prefix
    
    // Split by commas
    int firstComma = data.indexOf(',');
    int secondComma = data.indexOf(',', firstComma + 1);
    
    String pitchName = data.substring(0, firstComma);
    int step = data.substring(firstComma + 1, secondComma).toInt();
    int bpm = data.substring(secondComma + 1).toInt();
    
    // PLAY NOTE IMMEDIATELY!
    Serial.print("   Playing note: ");
    Serial.print(pitchName);
    Serial.print(" (step ");
    Serial.print(step);
    Serial.print(", BPM ");
    Serial.print(bpm);
    Serial.println(")");
    
    playNote(pitchName);
  }
  
  // Parse PLAY command
  // This just sets state - backend will send NOTE commands at right times
  else if (cmd == "PLAY") {
    Serial.println("▶️  Playback started (waiting for NOTE commands...)");
    isPlaying = true;
  }
  
  // Parse STOP command
  else if (cmd == "STOP") {
    Serial.println("⏹️  Playback stopped");
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
void stopPlayback() {
  isPlaying = false;
  
  // Release all hardware
  releaseAllHardware();
  
  Serial.println("🛑 Released all hardware");
}


// ============================================================================
// NOTE PLAYBACK - IMMEDIATE EXECUTION
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
  // if (noteName == "E4") {
  //   stringNum = 1;
  //   fretNum = 0;
  // }
  // else if (noteName == "F4") {
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
   * Move the servo to pluck the specified string.
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
//   int basePin = 2 + (stringNum - 1) * 6;
//   return basePin + fretNum;
// }
