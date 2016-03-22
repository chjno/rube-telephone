var socket;
var translateKey;


function preload(){
  loadJSON('creds.json', loadKeys);
}

function loadKeys(data) {
  // console.log("data: ", data);

  // console.log("ocrkey: ", data.ocrkey);
  translateKey = data.translatekey;
  // console.log('key : ', data.translatekey);
}

function setup() {
  // recButton = createButton('Start recording');
  // recButton.mousePressed(startRec);
  // startRec();

  // Start a socket connection to the server
  socket = io.connect('http://localhost:8080');
  ocrSetup();


  socket.on('morseIn', function(data) {
    translateToMorse(data);
  });

  // socket.on('translate', function(data) {
  //   // console.log("p5: " + data.str);
  //   // console.log("p5: " + data.sourceLang);
  //   // console.log("p5: " + data.targetLang);

  //   translateString(data.str, data.sourceLang, data.targetLang);
  // });

  socket.on('speak', function(data) {
    speak(data.str, data.sourceLang);
  });

  socket.on('ocrPhoto', function(data) {
    // setTimeout(saveScreen, 5000);
    saveScreen(data);
  });

  socket.on('startRec', function() {
    recResult = false;
    startRec();
  });

  setInterval(startRec, 3000);

}

function togglePhone(data) {
  socket.emit('togglePhone', data);
}