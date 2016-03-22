var translateBase = 'https://www.googleapis.com/language/translate/v2?key=';
// var sourceLang = 'en';
// var targetLang = 'es';
// var targetString;
// var doneTranslating = false;

function translateString(sourceString, sourceLang, targetLang) {
  var formattedString = sourceString.split(' ').join('%20');
  var translateURL = translateBase + translateKey + '&source=' + sourceLang + '&target=' + targetLang + '&q=' + formattedString;

  loadJSON(translateURL, function(translateData) {
    var receivedString = translateData.data.translations[0].translatedText;

    // fix encoding
    var div = document.createElement('div');
    div.innerHTML = receivedString;
    translatedString = div.textContent;

    sendTransStr(translatedString);
  });
}

function sendTransStr(str) {
  socket.emit('translated', str);
}


  // print(targetString);
  // myVoice.speak(targetString);
  // if (!doneTranslating) {
  //   translateString(targetString, 'es', 'en');
  // }
  // doneTranslating = true;
  // myVoice.setVoice(1);