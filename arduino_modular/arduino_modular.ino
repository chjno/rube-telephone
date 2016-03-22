#include <Adafruit_Thermal.h>

//#include <StandardCplusplus.h>
//#include <vector>
#include "Adafruit_Thermal.h"
#include "SoftwareSerial.h"
#define TX_PIN 7 // Arduino transmit  YELLOW WIRE  labeled RX on printer
#define RX_PIN 6 // Arduino receive   GREEN WIRE   labeled TX on printer

SoftwareSerial mySerial(RX_PIN, TX_PIN); // Declare SoftwareSerial obj first
Adafruit_Thermal printer(&mySerial);     // Pass addr to printer constructor

const int vPhoneL = 2; // red to phone jack yellow
const int sPhoneL = 3; // blue to 17 above ringer to phone jack black
const int leftRelayPin = 4; // yellow to 11 left of relay
const int leftInhPin = 5; // green to 25 left of ringer

const int vPhoneR = 8; // red to phone jack yellow
const int sPhoneR = 9; // blue to 15 above ringer
const int rightRelayPin = 10; // yellow to 13 right of relay
const int rightInhPin = 11; // green to 25 left of ringer

const int morseKeyPin = 12;
const int solenoidPin = 13;
const int piezoPin = A0;

const int light1pin = A1;
const int light2pin = A2;
const int light3pin = A3;
const int light4pin = A4;
const int light5pin = A5;

String inString = "";
int inChar = 0;
//boolean incoming = false;
//std::vector<int> dotLengths;
int dotLengths[10] = {0, 0, 0, 0, 0, 0, 0, 0, 0, 0};
int playArr[10] = {1, 1, 1, 1, 1, 1, 1, 1, 1, 1};
int dlIndex = 0;
//boolean morseEnd = false;
boolean startPlaying = false;
boolean notePlaying = true;
boolean firstNote = true;
long startTime = 0;
int currentNote = 0;
int inCharType = 0;
boolean staggerMorse = true;
int phoneState = 0;
boolean systemStart = false;
boolean needsRestart = false;
boolean phone1 = true;

void setup() {
  pinMode(light1pin, OUTPUT);
  pinMode(light2pin, OUTPUT);
  pinMode(light3pin, OUTPUT);
  pinMode(light4pin, OUTPUT);
  pinMode(light5pin, OUTPUT);
  noLight();

  pinMode(solenoidPin, OUTPUT);
  pinMode(piezoPin, OUTPUT);
  pinMode(morseKeyPin, INPUT);

  pinMode(vPhoneL, OUTPUT);
  pinMode(sPhoneL, INPUT);
  pinMode(leftRelayPin, OUTPUT);
  pinMode(leftInhPin, OUTPUT);

  pinMode(vPhoneR, OUTPUT);
  pinMode(sPhoneR, INPUT);
  pinMode(rightRelayPin, OUTPUT);
  pinMode(rightInhPin, OUTPUT);

  // send voltage through hook circuits
  digitalWrite(vPhoneL, HIGH);
  digitalWrite(vPhoneR, HIGH);

  Serial.begin(9600);
  while (!Serial) {
    ; // wait for serial port to connect. Needed for native USB port only
  }

  mySerial.begin(19200);  // Initialize SoftwareSerial
  mySerial.listen();
  printer.begin();

  //delete
//  bothRaised();
//  rightHung();
}

void resetVars() {
  Serial.flush();
  inCharType = 0;
  dlIndex = 0;
  inChar = 0;
  inString = "";

  for (int i = 0; i < 10; i++) {
    dotLengths[i] = 0;
    playArr[i] = 1;
  }
  //  OR ?
  //  dotLengths[10] = {0, 0, 0, 0, 0, 0, 0, 0, 0, 0};
  //  playArr[10] = {1, 1, 1, 1, 1, 1, 1, 1, 1, 1};

  startPlaying = false;
  notePlaying = true;
  firstNote = true;
  staggerMorse = true;
  currentNote = 0;
  digitalWrite(solenoidPin, LOW);
  bothLights();

}

void haltSystem() {
  systemStart = false;
  needsRestart = true;
  resetVars();
  noLight();
}

void loop() {

  //delete

    if (digitalRead(sPhoneL) == HIGH && digitalRead(sPhoneR) == HIGH && phoneState != 0) {
      noneRaised();
    } else if (digitalRead(sPhoneL) == LOW && digitalRead(sPhoneR) == HIGH) {
      if (phoneState != 1) {
        if (phoneState == 0) {
          leftRaised();
        } else if (phoneState == 3) {
          rightHung();
        };
        phoneState = 1;
      };
    } else if (digitalRead(sPhoneL) == HIGH && digitalRead(sPhoneR) == LOW) {
      if (phoneState != 2) {
        if (phoneState == 0) {
          rightRaised();
        } else if (phoneState == 3) {
          leftHung();
        }
        phoneState = 2;
      };
    } else if (digitalRead(sPhoneL) == LOW && digitalRead(sPhoneR) == LOW) {
      if (phoneState != 3 && !needsRestart) {
        bothRaised();
      };
    };

  if (systemStart) {                // if both_raised

    if (Serial.available() > 0) {
      inChar = Serial.read();

      // node light triggers
      if (inChar == '<') {
        leftLight();
        phone1 = true;
      } else if (inChar == '>') {
        rightLight();
        phone1 = false;
      } else if (inChar == '&') {
        bothLights();
        resetVars();
      } else if (inChar == '[') {
        rightLight();
      } else if (inChar == ']') {
        translateLight();
      };

      // trigger intake
      if (inCharType == 1) {
        intakeMorse();
      } else if (inCharType == 2) {
        intakeThermStr();
      };

      // set intake mode
      if (inChar == '%') {
        inCharType = 1;
        morseLight();
      } else if (inChar == '^') {
        inCharType = 2;
        ocrLight();
      }
    }

    // reset morse
    if (playArr[currentNote] == 0) {
      resetMorse();
    }

    // play morse pattern with solenoid
    if (startPlaying) {
      playSolenoid();
    }

    // morse key piezo audio
    playPiezo();
  }
}

// morse dotlengths intake
void intakeMorse() {

  // end morse intake
  if (inChar == '$') {
    for (int i = dlIndex; i < 10; i++) {
      dotLengths[i] = 0;
    }

    // print array to node console
    //        Serial.print("arduino dotLengths: ");
    //        for (int i = 0; i < 10; i++) {
    //          Serial.print(dotLengths[i]);
    //          Serial.print(',');
    //        }
    //        Serial.println("");

    // reset morse intake
    inCharType = 0;
    dlIndex = 0;

    // add value to array
  } else if (inChar == ',') {
    dotLengths[dlIndex] = inString.toInt();
    //          Serial.print("a: dotLengths[");
    //          Serial.print(dlIndex);
    //          Serial.print("] = ");
    //          Serial.println(inString);
    inString = "";
    dlIndex++;
    if (dlIndex == 10) {

      // debug handshake
      //      Serial.print("a dotlengths:");
      //      for (int j = 0; j < 10; j++) {
      //        Serial.print(dotLengths[j]);
      //        Serial.print(',');
      //      }
      //      Serial.println("");

      dlIndex = 0;

      for (int i = 0; i < 10; i++) {
        playArr[i] = dotLengths[i];
      }

      // if playing hasn't started
      if (staggerMorse) {
        Serial.println('%');
        staggerMorse = false;
        startPlaying = true;
      }
    }

    // intake byte from serial buffer
  } else {
    inString += (char)inChar;
  }
}

// ring
void ringRight() {
  // switch from audio to ringer

  digitalWrite(rightRelayPin, HIGH); // switch relay to ringer circuit
  delay(20);
  digitalWrite(rightInhPin, LOW); // uninhibit ringer
}

void ringLeft() {
  digitalWrite(leftRelayPin, HIGH); // switch relay to ringer circuit
  delay(20);
  digitalWrite(leftInhPin, LOW); // uninhibit ringer
}

void killRing() {
  // switch from ringer to audio
  digitalWrite(leftInhPin, HIGH); // inhibit ringer
  digitalWrite(rightInhPin, HIGH);
  delay(20);
  digitalWrite(leftRelayPin, LOW); // switch to audio circuit
  digitalWrite(rightRelayPin, LOW);
}



// hook states
void noneRaised() {
  noLight();
  // systemStart = false;
  needsRestart = false;
  phoneState = 0;
  Serial.println('0');
  killRing();
}

void leftRaised() {
  ringRight();
  Serial.println('1');
}

void leftHung() {
  haltSystem();
  Serial.println('8');
}

void rightRaised() {
  ringLeft();
  Serial.println('2');
}

void rightHung() {
  haltSystem();
  Serial.println('9');
}

void bothRaised() {
  killRing();
  systemStart = true;
  Serial.println('3');
  phoneState = 3;
  bothLights();
  resetVars();
}

void resetMorse() {
  for (int i = 0; i < 10; i++) {
    dotLengths[i] = 0;
    playArr[i] = 1;
  }
  //  dotLengths[10] = {0, 0, 0, 0, 0, 0, 0, 0, 0, 0};
  //  playArr[10] = {1, 1, 1, 1, 1, 1, 1, 1, 1, 1};
  startPlaying = false;
  notePlaying = true;
  firstNote = true;
  staggerMorse = true;
  currentNote = 0;
  if (phone1) {
    translateLight();
  } else {
    leftLight();
  };

  // initiate translation
  Serial.println('T');
}

// debug handshake
//int count = 2;

void playSolenoid() {

  if (firstNote) {
    startTime = millis();
    firstNote = false;
  }
  if (notePlaying) {
    digitalWrite(solenoidPin, HIGH);
  } else {
    digitalWrite(solenoidPin, LOW);
  }

  if (millis() - startTime > playArr[currentNote]) {
    currentNote++;

    playArr[currentNote - 1] = dotLengths[currentNote - 1];

    if (currentNote == 10) {
      currentNote = 0;
      if (dotLengths[9] != 0) {
        Serial.println('%');
      }
    }
    startTime = millis();
    notePlaying = !notePlaying;

    // debug handshake
    //    if (notePlaying) {
    //      Serial.print("a playing note ");
    //    } else {
    //      Serial.print("a not playing ");
    //    }
    //    Serial.println(count);
    //    count++;

  }
}

void playPiezo() {
  if (digitalRead(morseKeyPin) == HIGH) {
    tone(piezoPin, 750);
  } else {
    noTone(piezoPin);
  }
}

// thermal print string intake
void intakeThermStr() {

  // end string intake
  if (inChar == '$') {

    // debug therm string intake
//    Serial.print("arduino therm string: ");
//    Serial.println(inString);

    // thermal print
    printer.println(inString);
    printer.feed(2);
    printer.sleep();
    Serial.println('O');
    delay(3000L);
    printer.wake();
    printer.setDefault();

    // reset thermal print intake
    inString = "";
    inCharType = 0;

    // intake byte from serial buffer
  } else {
    inString += (char)inChar;
    Serial.println('^');
  };
}


void noLight() {
  digitalWrite(light1pin, HIGH);
  digitalWrite(light2pin, HIGH);
  digitalWrite(light3pin, HIGH);
  digitalWrite(light4pin, HIGH);
  digitalWrite(light5pin, HIGH);
}

void leftLight() {
  digitalWrite(light1pin, LOW);
  digitalWrite(light2pin, HIGH);
  digitalWrite(light3pin, HIGH);
  digitalWrite(light4pin, HIGH);
  digitalWrite(light5pin, HIGH);
}

void morseLight() {
  digitalWrite(light1pin, HIGH);
  digitalWrite(light2pin, LOW);
  digitalWrite(light3pin, HIGH);
  digitalWrite(light4pin, HIGH);
  digitalWrite(light5pin, HIGH);
}

void translateLight() {
  digitalWrite(light1pin, HIGH);
  digitalWrite(light2pin, HIGH);
  digitalWrite(light3pin, LOW);
  digitalWrite(light4pin, HIGH);
  digitalWrite(light5pin, HIGH);
}

void ocrLight() {
  digitalWrite(light1pin, HIGH);
  digitalWrite(light2pin, HIGH);
  digitalWrite(light3pin, HIGH);
  digitalWrite(light4pin, LOW);
  digitalWrite(light5pin, HIGH);
}

void rightLight() {
  digitalWrite(light1pin, HIGH);
  digitalWrite(light2pin, HIGH);
  digitalWrite(light3pin, HIGH);
  digitalWrite(light4pin, HIGH);
  digitalWrite(light5pin, LOW);
}

void bothLights() {
  digitalWrite(light1pin, LOW);
  digitalWrite(light2pin, HIGH);
  digitalWrite(light3pin, HIGH);
  digitalWrite(light4pin, HIGH);
  digitalWrite(light5pin, LOW);
}
