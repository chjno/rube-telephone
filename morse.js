var dotLength = 40;
var morseDict = {
    "A": ".-",
    "B": "-...",
    "C": "-.-.",
    "D": "-..",
    "E": ".",
    "F": "..-.",
    "G": "--.",
    "H": "....",
    "I": "..",
    "J": ".---",
    "K": "-.-",
    "L": ".-..",
    "M": "--",
    "N": "-.",
    "O": "---",
    "P": ".--.",
    "Q": "--.-",
    "R": ".-.",
    "S": "...",
    "T": "-",
    "U": "..-",
    "W": ".--",
    "X": "-..-",
    "Y": "-.--",
    "Z": "--..",
    " ": "/",
    "0": "-----",
    "1": ".----",
    "2": "..---",
    "3": "...--",
    "4": "....-",
    "5": ".....",
    "6": "-....",
    "7": "--...",
    "8": "---..",
    "9": "----.",
    "(": "-.--.",
    ")": "-.--.-",
    ".": ".-.-.-",
    ",": "--..--",
    ":": "---...",
    ";": "-.-.-.",
    "?": "..--..",
    "'": ".----.",
    "-": "-....-",
    "/": "-..-.",
    "\"": ".-..-.",
    "@": ".--.-.",
    "=": "-...-",
    "!": "-.-.--",
    "&": ".-...",
    "+": ".-.-.",
    "_": "..--.-",
    "$": "...-..-"
}
var morseLengths = {
  ".": dotLength,
  "-": 3 * dotLength,
  // " ": 3 * dotLength,
  "/": dotLength,
}

function translateToMorse(text) {
  var lettersArr = [];
  var morseArr = [];

  lettersArr = text.toUpperCase().split('');

  for (var i = 0; i < lettersArr.length; i++) {
    if (morseDict[lettersArr[i]]) {
      morseArr.push(morseDict[lettersArr[i]]);
    }
  }

  morseString = morseArr.join(' ');
  // console.log(morseString);
  genMorseArray(morseString)
  // return morseString;
}

function genMorseArray(mString) {
  var dotLengthArr = [];

  for (var i = 0; i < mString.length; i++) {
    if (mString[i] == "." || mString[i] == "-") {
      dotLengthArr.push(morseLengths[mString[i]]);
      if (mString[i + 1] == " ") {
        if (mString[i + 2] == "/") {
          dotLengthArr.push(7 * dotLength);
        } else {
          dotLengthArr.push(3 * dotLength);
        }
      } else {
        dotLengthArr.push(dotLength);
      }
    }
  }
  // print(dotLengthArr);
  sendMorse(mString, dotLengthArr);
  // return dotLengthArr;
}

function sendMorse(morse, dotLengthArray) {
  // var dls = dotLengthArray.join(',');
  // var dlsl = dls.length;

  var data = {
    morseString: morse,
    morseNums: dotLengthArray
    // charLength: dlsl
  };

  socket.emit('morseOut', data);
}