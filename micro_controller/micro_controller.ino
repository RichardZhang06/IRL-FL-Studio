/*
 * SERVO + STEPPER CONTROLLER - Arduino Uno
 * IRL Studio Guitar Controller
 * 
 * Servos: Pins 2-7 (6 channels)
 * Stepper: Pin 8 (STEP), 9 (DIR), 10 (ENA)
 * 
 * STRING TO PIN MAPPING:
 *   String 0 -> Pin 4 (servo index 2)
 *   String 1 -> Pin 2 (servo index 0)
 *   String 2 -> Pin 5 (servo index 3)
 *   String 3 -> Pin 3 (servo index 1)
 *   String 4 -> Pin 6 (servo index 4)
 *   String 5 -> Pin 7 (servo index 5)
 * 
 * BACKEND COMMANDS:
 *   S:0:0:E4    - Pluck string 0, fret 0, note E4
 *   N:E4        - Play note E4 (fallback)
 *   PLAY        - Playback started
 *   STOP        - Stop all
 * 
 * SERIAL MONITOR COMMANDS:
 *   S0:90       - Set servo 0 to 90°
 *   A:90        - Set all servos to 90°
 *   C           - Center all servos (90°)
 *   P           - Show servo positions
 *   R0          - Strum servo 0 (preset swing, 1 time)
 *   R0:3        - Strum servo 0 (preset swing, 3 times)
 *   T0:105:30   - Tune servo 0 (start:105, swing:30)
 * 
 * STEPPER COMMANDS:
 *   M:100       - Move 100 steps (negative for reverse)
 *   D:10        - Move 10mm (negative for reverse)
 *   V:800       - Set speed (steps/sec)
 *   E           - Enable motor
 *   X           - Disable motor
 *   Z           - Set current position as zero
 *   L           - Show position
 */

 #include <Servo.h>

 // ============================================================================
 // PIN DEFINITIONS
 // ============================================================================
 // Servos
 const byte SERVO_PINS[6] = {2, 3, 4, 5, 6, 7};
 
 // String number to servo index mapping
 // String 0->pin4(idx2), 1->pin2(idx0), 2->pin5(idx3), 3->pin3(idx1), 4->pin6(idx4), 5->pin7(idx5)
 const byte STRING_TO_SERVO[6] = {2, 0, 3, 1, 4, 5};
 
 // Stepper (TB6600)
 const byte STEP_PIN = 8;
 const byte DIR_PIN = 9;
 const byte ENA_PIN = 10;
 
 // ============================================================================
 // SERVO STATE
 // ============================================================================
 Servo servos[6];
 byte angles[6] = {90, 90, 90, 90, 90, 90};
 
 // Strum tuning per servo: start position, swing angle
 //                         S0   S1   S2   S3   S4   S5
 byte strumStart[6] = {105, 105, 105, 105, 105, 105};
 byte strumSwing[6] = { 50,  50,  50,  50,  50,  50};
 
 // ============================================================================
 // STEPPER CONFIG & STATE
 // ============================================================================
 const int STEPS_PER_REV = 200;
 const int MICROSTEP = 16;
 const float MM_PER_STEP = 8.0 / (STEPS_PER_REV * MICROSTEP);  // 8mm lead screw
 
 int stepSpeed = 1600;       // steps/sec
 long stepPos = 0;           // current position in steps
 bool motorOn = false;
 bool isPlaying = false;     // Playback state
 
 // ============================================================================
 // SETUP
 // ============================================================================
 void setup() {
   Serial.begin(9600);
   
   // Servos
   for (int i = 0; i < 6; i++) {
     servos[i].attach(SERVO_PINS[i]);
     servos[i].write(90);
   }
   
   // Stepper
   pinMode(STEP_PIN, OUTPUT);
   pinMode(DIR_PIN, OUTPUT);
   pinMode(ENA_PIN, OUTPUT);
   digitalWrite(ENA_PIN, HIGH);  // Disabled initially
   
   Serial.println(F("Ready"));
   Serial.println(F("Servo: S0:90 A:90 C P R0 T0:105:30"));
   Serial.println(F("Stepper: M:100 D:10 V:800 E X Z L"));
 }
 
 // ============================================================================
 // MAIN LOOP
 // ============================================================================
 void loop() {
   if (!Serial.available()) return;
   
   String line = Serial.readStringUntil('\n');
   line.trim();
   if (line.length() == 0) return;
   
   // ==================== BACKEND COMMANDS ====================
   
   // Backend string command: S:stringNum:fret:note (e.g., S:2:3:D3)
   if (line.startsWith("S:")) {
     int col1 = line.indexOf(':');
     int col2 = line.indexOf(':', col1 + 1);
     if (col1 > 0 && col2 > 0) {
       int stringNum = line.substring(col1 + 1, col2).toInt();
       // fret and note not needed for servo-only control
       if (stringNum >= 0 && stringNum < 6) {
         int servoIdx = STRING_TO_SERVO[stringNum];
         pluckString(servoIdx);
         Serial.print(F("Pluck str:")); Serial.print(stringNum);
         Serial.print(F(" servo:")); Serial.println(servoIdx);
       }
     }
     return;
   }
   
   // Backend note command: N:note (fallback, pluck string 0)
   if (line.startsWith("N:")) {
     int servoIdx = STRING_TO_SERVO[0];
     pluckString(servoIdx);
     Serial.print(F("Note:")); Serial.println(line.substring(2));
     return;
   }
   
   // PLAY command
   if (line == "PLAY") {
     isPlaying = true;
     Serial.println(F("Playing"));
     return;
   }
   
   // STOP command
   if (line == "STOP") {
     isPlaying = false;
     for (int i = 0; i < 6; i++) {
       servos[i].write(90);
       angles[i] = 90;
     }
     Serial.println(F("Stopped"));
     return;
   }
   
   // ==================== SERIAL MONITOR COMMANDS ====================
   
   char cmd = line.charAt(0);
   
   // ==================== SERVO COMMANDS ====================
   
   // Individual servo: S0:90
   if (cmd == 'S' || cmd == 's') {
     int idx = line.substring(1).toInt();
     int colIdx = line.indexOf(':');
     if (colIdx > 0) {
       int angle = constrain(line.substring(colIdx + 1).toInt(), 0, 180);
       if (idx >= 0 && idx < 6) {
         servos[idx].write(angle);
         angles[idx] = angle;
         Serial.print(F("S")); Serial.print(idx);
         Serial.print(F(":")); Serial.println(angle);
       }
     }
   }
   // All servos: A:90
   else if (cmd == 'A' || cmd == 'a') {
     int colIdx = line.indexOf(':');
     if (colIdx > 0) {
       int angle = constrain(line.substring(colIdx + 1).toInt(), 0, 180);
       for (int i = 0; i < 6; i++) {
         servos[i].write(angle);
         angles[i] = angle;
       }
       Serial.print(F("All:")); Serial.println(angle);
     }
   }
   // Center: C
   else if (cmd == 'C' || cmd == 'c') {
     for (int i = 0; i < 6; i++) {
       servos[i].write(90);
       angles[i] = 90;
     }
     Serial.println(F("Centered"));
   }
   // Position: P
   else if (cmd == 'P' || cmd == 'p') {
     for (int i = 0; i < 6; i++) {
       Serial.print(F("S")); Serial.print(i);
       Serial.print(F(":")); Serial.print(angles[i]);
       Serial.print(F(" "));
     }
     Serial.println();
   }
   // Strum: R0 or R0:3 (uses preset swing) or R0:30:3 (custom swing)
   else if (cmd == 'R' || cmd == 'r') {
     int idx = line.substring(1).toInt();
     if (idx >= 0 && idx < 6) {
       int col1 = line.indexOf(':');
       int swing = strumSwing[idx];  // Default to preset
       int count = 1;  // Default count
       
       if (col1 > 0) {
         int col2 = line.indexOf(':', col1 + 1);
         if (col2 > 0) {
           // R0:30:3 format (custom swing and count)
           swing = line.substring(col1 + 1).toInt();
           count = line.substring(col2 + 1).toInt();
         } else {
           // R0:3 format (preset swing, custom count)
           count = line.substring(col1 + 1).toInt();
         }
       }
       
       swing = constrain(swing, 1, 90);
       count = constrain(count, 1, 20);
       
       byte start = strumStart[idx];
       byte low = constrain(start - swing, 0, 180);
       
       servos[idx].write(start);
       delay(200);
       
       Serial.print(F("Strum S")); Serial.print(idx);
       Serial.print(F(" -")); Serial.print(swing);
       Serial.print(F(" x")); Serial.println(count);
       
       // Cycle: start -> low -> start
       for (int i = 0; i < count; i++) {
         servos[idx].write(low);
         delay(250);
         servos[idx].write(start);
         delay(250);
       }
       servos[idx].write(90);
       angles[idx] = 90;
     }
   }
   // Tune strum: T0:105:30 (servo, start, swing)
   else if (cmd == 'T' || cmd == 't') {
     int idx = line.substring(1).toInt();
     int col1 = line.indexOf(':');
     int col2 = line.indexOf(':', col1 + 1);
     if (col1 > 0 && idx >= 0 && idx < 6) {
       strumStart[idx] = constrain(line.substring(col1 + 1).toInt(), 0, 180);
       if (col2 > 0) {
         strumSwing[idx] = constrain(line.substring(col2 + 1).toInt(), 1, 90);
       }
       Serial.print(F("Tune S")); Serial.print(idx);
       Serial.print(F(" start:")); Serial.print(strumStart[idx]);
       Serial.print(F(" swing:")); Serial.println(strumSwing[idx]);
     }
   }
   
   // ==================== STEPPER COMMANDS ====================
   
   // Move steps: M:100 or M:-100
   else if (cmd == 'M' || cmd == 'm') {
     int colIdx = line.indexOf(':');
     if (colIdx > 0) {
       long steps = line.substring(colIdx + 1).toInt();
       Serial.print(F("Move:")); Serial.println(steps);
       moveSteps(steps);
       showStepperPos();
     }
   }
   // Move mm: D:10 or D:-10
   else if (cmd == 'D' || cmd == 'd') {
     int colIdx = line.indexOf(':');
     if (colIdx > 0) {
       float mm = line.substring(colIdx + 1).toFloat();
       long steps = (long)(mm / MM_PER_STEP);
       Serial.print(F("Move:")); Serial.print(mm);
       Serial.println(F("mm"));
       moveSteps(steps);
       showStepperPos();
     }
   }
   // Speed: V:800
   else if (cmd == 'V' || cmd == 'v') {
     int colIdx = line.indexOf(':');
     if (colIdx > 0) {
       stepSpeed = constrain(line.substring(colIdx + 1).toInt(), 50, 4000);
       Serial.print(F("Speed:")); Serial.println(stepSpeed);
     }
   }
   // Enable: E
   else if (cmd == 'E' || cmd == 'e') {
     digitalWrite(ENA_PIN, LOW);
     motorOn = true;
     Serial.println(F("Motor ON"));
   }
   // Disable: X
   else if (cmd == 'X' || cmd == 'x') {
     digitalWrite(ENA_PIN, HIGH);
     motorOn = false;
     Serial.println(F("Motor OFF"));
   }
   // Zero: Z
   else if (cmd == 'Z' || cmd == 'z') {
     stepPos = 0;
     Serial.println(F("Zero set"));
   }
   // Location: L
   else if (cmd == 'L' || cmd == 'l') {
     showStepperPos();
   }
 }
 
 // ============================================================================
 // STEPPER FUNCTIONS
 // ============================================================================
 void moveSteps(long steps) {
   if (!motorOn) {
     Serial.println(F("Motor off! E to enable"));
     return;
   }
   if (steps == 0) return;
   
   // Set direction
   digitalWrite(DIR_PIN, steps > 0 ? HIGH : LOW);
   delayMicroseconds(10);
   
   long absSteps = abs(steps);
   unsigned long stepDelay = 1000000L / stepSpeed;
   
   for (long i = 0; i < absSteps; i++) {
     digitalWrite(STEP_PIN, HIGH);
     delayMicroseconds(5);
     digitalWrite(STEP_PIN, LOW);
     delayMicroseconds(stepDelay);
     
     stepPos += (steps > 0) ? 1 : -1;
   }
 }
 
 void showStepperPos() {
   float mm = stepPos * MM_PER_STEP;
   Serial.print(F("Pos:")); Serial.print(mm, 2);
   Serial.print(F("mm (")); Serial.print(stepPos);
   Serial.println(F(" steps)"));
 }
 
 // ============================================================================
 // PLUCK FUNCTION (for backend commands)
 // ============================================================================
 void pluckString(int servoIdx) {
   if (servoIdx < 0 || servoIdx > 5) return;
   
   byte start = strumStart[servoIdx];
   byte swing = strumSwing[servoIdx];
   byte low = constrain(start - swing, 0, 180);
   
   // Single strum cycle: start -> low -> start -> 90
   servos[servoIdx].write(start);
   delay(250);
   servos[servoIdx].write(low);
   delay(250);
   servos[servoIdx].write(start);
   delay(250);
   servos[servoIdx].write(90);
   angles[servoIdx] = 90;
 }
 