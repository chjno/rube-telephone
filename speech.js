var myVoice = new p5.Speech();
var myRec = new p5.SpeechRec();
// myRec.continuous = true;
var recResult = false;

var voiceDict = {
  'de': 0,
  'en': 1,
  'es': 5,
  'fr': 6,
  'hi': 7,
  'id': 8,
  'it': 9,
  'ja': 10,
  'ko': 11,
  'nl': 12,
  'pl': 13,
  'pt': 14,
  'ru': 15,
  'zh-CN': 16
};

function speak(text, lang) {
  myVoice.setVoice(voiceDict[lang]);

  myVoice.speak(text);
  myVoice.onEnd = doneSpeaking;
}

function doneSpeaking() {
  socket.emit('doneSpeaking');
}

function startRec() {
  if (!recResult) {
    myRec.onResult = parseRec;
    myRec.start();
  };
}

function parseRec() {
  recResult = true;
  if (myRec.resultValue) {
    sendDictation(myRec.resultString);
  }
}

// function sendInputKill() {
//   socket.emit('inputKill');
// }

function sendDictation(text) {
  socket.emit('dictation', text);
}