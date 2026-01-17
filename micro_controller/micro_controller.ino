/*
 * IRL Studio - Arduino Uno Guitar Controller
 * Backend handles timing, Arduino executes commands immediately.
 * 
 * Commands from backend:
 *   N:C4    - Play note C4 now
 *   PLAY    - Playback started
 *   STOP    - Stop and release all
 */

 #include <Servo.h>

 // ============================================================================
 // PIN DEFINITIONS - TODO: Define your pins
 // ============================================================================
 // Servo pins (for plucking each string)
 const byte SERVO_PINS[6] = {2, 3, 4, 5, 6, 7};
 
 // Solenoid pins - TODO: Add your solenoid pin definitions
 // Example: const byte FRET_PINS[6][5] = { {8,9,10,11,12}, ... };
 
 // ============================================================================
 // HARDWARE
 // ============================================================================
 Servo servos[6];
 bool isPlaying = false;
 
 // Servo positions
 const byte SERVO_REST = 90;
 const byte SERVO_PLUCK = 60;
 
 // ============================================================================
 // SETUP
 // ============================================================================
 void setup() {
   Serial.begin(9600);
   
   // Attach servos
   for (int i = 0; i < 6; i++) {
     servos[i].attach(SERVO_PINS[i]);
     servos[i].write(SERVO_REST);
   }
   
   // TODO: Initialize solenoid pins as OUTPUT
   // for (int i = 0; i < NUM_SOLENOIDS; i++) {
   //   pinMode(solenoidPin[i], OUTPUT);
   // }
   
   Serial.println(F("Ready"));
 }
 
 // ============================================================================
 // MAIN LOOP
 // ============================================================================
 void loop() {
   if (Serial.available()) {
     String cmd = Serial.readStringUntil('\n');
     cmd.trim();
     
     // Note command: N:C4
     if (cmd.startsWith("N:")) {
       String note = cmd.substring(2);
       playNote(note);
     }
     // Play command
     else if (cmd == "PLAY") {
       isPlaying = true;
       Serial.println(F("Playing"));
     }
     // Stop command
     else if (cmd == "STOP") {
       isPlaying = false;
       releaseAll();
       Serial.println(F("Stopped"));
     }
   }
 }
 
 // ============================================================================
 // NOTE PLAYBACK
 // ============================================================================
 void playNote(String note) {
   Serial.print(F("N:")); Serial.println(note);
   
   // Get string and fret from note name
   int str, fret;
   mapNote(note, str, fret);
   
   if (str < 0 || str > 5) return;  // Invalid
   
   // TODO: Press fret (activate solenoid)
   // pressFret(str, fret);
   // delay(30);  // Wait for solenoid
   
   // Pluck string
   pluck(str);
   
   // TODO: Release fret after note rings
   // delay(100);
   // releaseFret(str, fret);
 }
 
 // ============================================================================
 // NOTE MAPPING - TODO: Fill in your mapping
 // ============================================================================
 void mapNote(String note, int &str, int &fret) {
   /*
    * Map note names to string (0-5) and fret (0-4)
    * 
    * Example standard tuning:
    * String 0 (E4): E4=0, F4=1, F#4=2, G4=3, G#4=4
    * String 1 (B3): B3=0, C4=1, C#4=2, D4=3, D#4=4
    * ... etc
    */
   
   // TODO: Add your note mappings
   // Example:
   // if (note == "E4") { str = 0; fret = 0; return; }
   // if (note == "F4") { str = 0; fret = 1; return; }
   // if (note == "B3") { str = 1; fret = 0; return; }
   
   // Default fallback - string 0, open
   str = 0;
   fret = 0;
 }
 
 // ============================================================================
 // SERVO CONTROL (Plucking)
 // ============================================================================
 void pluck(int str) {
   if (str < 0 || str > 5) return;
   
   servos[str].write(SERVO_PLUCK);
   delay(50);
   servos[str].write(SERVO_REST);
 }
 
 // ============================================================================
 // SOLENOID CONTROL (Fretting) - TODO: Implement
 // ============================================================================
 void pressFret(int str, int fret) {
   // TODO: Activate solenoid for string/fret
   // int pin = getFretPin(str, fret);
   // digitalWrite(pin, HIGH);
 }
 
 void releaseFret(int str, int fret) {
   // TODO: Deactivate solenoid
   // int pin = getFretPin(str, fret);
   // digitalWrite(pin, LOW);
 }
 
 void releaseAll() {
   // Reset all servos
   for (int i = 0; i < 6; i++) {
     servos[i].write(SERVO_REST);
   }
   
   // TODO: Release all solenoids
   // for (int i = 0; i < NUM_SOLENOIDS; i++) {
   //   digitalWrite(solenoidPin[i], LOW);
   // }
 }
 