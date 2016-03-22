var canvas;
var captureWidth = 640;
var captureHeight = 480;

function ocrSetup() {
  canvas = createCanvas(captureWidth, captureHeight);
  canvas.position(70,60);
  capture = createCapture(VIDEO);
  capture.size(captureWidth, captureHeight);
  capture.hide();

  // ocrButton = createButton('Capture text');
  // ocrButton.mousePressed(saveScreen);

}

function draw() {
  // for saving OCR pic
  image(capture, 0, 0);
}

function saveScreen(lines) {

  var baseline = 0;
  // var lineHeight = 60;
  var lineHeight = 50;
  var cropHeight = lines * lineHeight;
  var yCoord = captureHeight - cropHeight - baseline;

  var cropped = canvas.get(15,yCoord,615,cropHeight);

  var filename = Date.now() + '.jpg';

  // save(canvas, filename);
  save(cropped, filename);

  sendPic(filename);
}

function sendPic(filename) {
  socket.emit('runOCR', filename);
}