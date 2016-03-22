// Built from Lauren McCarthy's example
// https://github.com/lmccart/itp-creative-js/blob/master/Spring-2014/week6/04_socket_server/server.js

// Based off of Shawn Van Every's Live Web
// http://itp.nyu.edu/~sve204/liveweb_fall2013/week3.html

var http = require('http');
var url = require('url');
var path = require('path');
var fs = require('fs-extra');
var osascript = require('node-osascript');

var server = http.createServer(handleRequest);
server.listen(8080);

console.log('Server started on port 8080');

function handleRequest(req, res) {
  // What did we request?
  var pathname = req.url;
  
  // If blank let's ask for index.html
  if (pathname == '/') {
    pathname = '/index.html';
  }
  
  // Ok what's our file extension
  var ext = path.extname(pathname);

  // Map extension to file type
  var typeExt = {
    '.html': 'text/html',
    '.js':   'text/javascript',
    '.css':  'text/css'
  };

  // What is it?  Default to plain text
  var contentType = typeExt[ext] || 'text/plain';

  // User file system module
  fs.readFile(__dirname + pathname, function (err, data) {
    if (err) {
      res.writeHead(500);
      return res.end('Error loading ' + pathname);
    }
    // Otherwise, send the data, the contents of the file
    res.writeHead(200,{ 'Content-Type': contentType });
    res.end(data);
  });
}

var io = require('socket.io').listen(server);
var PythonShell = require('python-shell');
var osc = require('./lib');
var client = new osc.Client('127.0.0.1', 3344);
var oscServer = new osc.Server(3366, '127.0.0.1');
var spawn = require('child_process').spawn;
var dictStr;
var dotLengths = [];
var translatedStr;
var translateObj2;
var ocrString;
var thermStr;
var thermStrLen;
var firstSpeech = true;
var phone1 = true;
// var langs = ['de','en','es','fr','hi','id','it','ja','ko','nl','pl','pt','ru','zh-CN'];
var langDict = {
  'de': 'German',
  // 'en':' English',
  'es': 'Spanish',
  'fr': 'French',
  'hi': 'Hindi',
  'id': 'Indonesian',
  'it': 'Italian',
  'ja': 'Japanese',
  'ko': 'Korean',
  'nl': 'Dutch',
  'pl': 'Polish',
  'pt': 'Portuguese',
  'ru': 'Russian',
  'zh-CN': 'Mandarin'
};
var langs = Object.keys(langDict);
var randomLang;
var listening = true;
// var bothRaised = false;
// var needsReset = false;

var googleTranslate = require('google-translate')('');

var charCount = 0;
var firstTranslation = true;
var translateObj;
var inCharTypeSent = false;
var serialport = require('serialport');
   SerialPort = serialport.SerialPort;
   portName = '/dev/cu.usbmodem142431';
var myPort = new SerialPort(portName, {
   baudRate: 9600,
   // look for return and newline at the end of each data packet:
   parser: serialport.parsers.readline("\n")
 });

var pics = fs.readdirSync('./pics');
// console.log(pics);
for (var i = 0; i < pics.length; i++) {
  var oldPath = './pics/' + pics[i];
  var newPath = './old_pics/' + pics[i];
  fs.renameSync(oldPath, newPath);
}

myPort.on('open', showPortOpen);
myPort.on('data', sendSerialData);
myPort.on('close', showPortClose);
myPort.on('error', showError);

function refreshChrome() {
  spawn('sh', ['reset.sh']);
  // osascript.execute('./refresh_chrome.scpt', function(err, result, raw){
  //   if (err) return console.error(err)
  //   // console.log(result, raw)
  // });
}
refreshChrome();

function showPortOpen() {
  // console.log('port open. Data rate: ' + myPort.options.baudRate);
}

client.send('/server_starts');

oscServer.on('message', function(msg, rinfo) {
  if (listening) {
    if (msg[0] == '/override_left') {
      // console.log('/override_left');
      phone1 = true;
      myPort.write('<');
    } else if (msg[0] == '/override_right') {
      // console.log('/override_right');
      phone1 = false;
      myPort.write('>');
    };
    // io.sockets.emit('startRec');
    listening = false;
  };
});

io.sockets.on('connection', function (socket) {

  // console.log("We have a new client: " + socket.id);

  // if (bothRaised) {
    socket.on('dictation', function(text) {
      client.send('/dictation_complete');
      dictStr = text;
      console.log("\nInput: ", dictStr);

      var newLang = langs[Math.floor(Math.random()*langs.length)];
      // randomLang = 'zh-TW';
      while (newLang == randomLang) {
        newLang = langs[Math.floor(Math.random()*langs.length)];
      };
      randomLang = newLang;

      if (phone1) {
        io.sockets.emit('morseIn', text);
      } else {
        thermStr = text;
        thermStrLen = dictStr.length;
        sendSerialData('^');
      };
    });

    socket.on('morseOut', function(data) {
      morseStr = data.morseString;
      dotLengths = data.morseNums;
      console.log("Morse: ", morseStr);
      // console.log("From p5: " + dotLengths);
      sendSerialData('%');
    });

    // socket.on('translated', function(data) {
    //   translatedStr = data;

    //   if (firstTranslation) {
    //     console.log(langDict[randomLang] + ': ' + translatedStr);
    //     translateObj = {
    //       str: translatedStr,
    //       sourceLang: randomLang,
    //       targetLang: 'en'
    //     };
    //     firstSpeech = true;
    //     io.sockets.emit('speak', translateObj);
    //     translate(translateObj);

    //   } else {
    //     // console.log(translatedStr);
    //     translateObj2 = {
    //       str: translatedStr,
    //       sourceLang: 'en'
    //     };
    //     if (phone1) {
    //       thermStr = translatedStr;
    //       thermStrLen = translatedStr.length;
    //       // sendSerialData('^');
    //     };
    //   };
    //   firstTranslation = false;
    // });

    socket.on('doneSpeaking', function() {

      // make sure second translation is finished before doing these firstSpeech things
      if (firstSpeech) {
        if (phone1) {
          sendSerialData('^');
        } else {
          io.sockets.emit('morseIn', translatedStr);
        };
        client.send('/foreign_complete');
      } else {
        // tell max it's all done
        if (phone1) {
          console.log('OUTPUT: ', ocrString);  
        } else {
          console.log('OUTPUT: ', translatedStr);
        };
        
        myPort.write('&');
        client.send('/transmission_complete');
        firstSpeech = true;
        listening = true;
        io.sockets.emit('startRec');
      };
    });

    socket.on('runOCR', function(data) {
      var filename = data;
      var options = {
        args: [filename]
      };
      // console.log("Uploading photo...");

      PythonShell.run('ocr.py', options, function(err, results) {
        var ocrResult = results;
        // to add: if err, use string from previous step

        // console.log("err: ", err);
        // console.log("results: ", results)

        if (err || results == null || results == '') {
          if (phone1) {
            ocrString = translateObj2.str;
          } else {
            ocrString = dictStr;
          };
        } else {
          // console.log(ocrResult);
          ocrString = ocrResult.join(' '); // test this
        };
        console.log('OCR: ' + ocrString);
        
        if (phone1) {
          myPort.write('[');
          client.send('/ocr_complete');
          firstSpeech = false;
          var ocrObj = {
            str: ocrString,
            sourceLang: 'en'
          };

          // change from ocrObj to translateObj2 to skip OCR
          io.sockets.emit('speak', ocrObj);
        } else {
          myPort.write(']');
          client.send('/ocr_complete');
          firstTranslation = true;
          translateObj = {

            // change from ocrString to dictStr to skip OCR
            str: ocrString,
            sourceLang: 'en',
            targetLang: randomLang
          };
          translate(translateObj);
        };
      });

      // if (phone1) {
      //   myPort.write('[');
      //   client.send('/ocr_complete');
      //   firstSpeech = false;
      //   var ocrObj = {
      //     str: ocrString,
      //     sourceLang: 'en'
      //   };

      //   // change to ocrString
      //   io.sockets.emit('speak', translateObj2);
      // } else {
      //   myPort.write(']');
      //   firstTranslation = true;
      //   translateObj = {

      //     // change to ocrString
      //     str: dictStr,
      //     sourceLang: 'en',
      //     targetLang: randomLang
      //   };
      //   translate(translateObj);
      // };
    });
  // };

  socket.on('togglePhone', function(data) {
    if (listening) {
      if (data == 'l') {
        console.log('/override_left');
        phone1 = true;
        myPort.write('<');
      } else if (data == 'r') {
        console.log('/override_right');
        phone1 = false;
        myPort.write('>');
      };
      listening = false;
    };
  });
  
  socket.on('disconnect', function() {
    // console.log("Client has disconnected");
  });
});

function sendSerialData(data) {

    // phone states from arduino
  if (data[0] == 0) {
    client.send('/none_raised');
    // if (needsReset) {
      // process.exit();
    // }
    // console.log('/none_raised');
  } else if (data[0] == 1) {
    client.send('/left_raised');
    // console.log('/left_raised');
  } else if (data[0] == 2) {
    client.send('/right_raised');
    // console.log('/right_raised');
  } else if (data[0] == 8) {
    client.send('/left_hung');
    // needsReset = true;
    resetSystem();
    refreshChrome();
    // console.log('/left_hung');
  } else if (data[0] == 9) {
    client.send('/right_hung');
    // needsReset = true;
    resetSystem();
    refreshChrome();
    // console.log('/right_hung');
  } else if (data[0] == 3) {
    client.send('/both_raised');
    // bothRaised = true;
    io.sockets.emit('startRec');
    // console.log('/both_raised');
  }

  // print anything from arduino that starts with a
  // if (data[0] == 'a') {
  //   console.log(data);
  // }

  // if (bothRaised) {

    // send morse to arduino
    if (data[0] == '%') {

      if (!inCharTypeSent) {
        // console.log('beginning morse to arduino');
        myPort.write('%');
        inCharTypeSent = true;
      }
      if (dotLengths.length <= 0) {
        myPort.write('$');
        inCharTypeSent = false;
        // dotLengths = [];
      } else {
        var chunk = dotLengths.slice(0,10);
        for (var i = 0; i < chunk.length; i++) {
          myPort.write(chunk[i] + ',');
        }
        dotLengths = dotLengths.slice(10);
      }
    }

    // Morse complete
    if (data[0] == 'T') {
      // console.log('Morse complete');
      if (phone1) {
        client.send('/morse_complete');
        firstTranslation = true;
        translateObj = {
          str: dictStr, // change to Morse translation
          sourceLang: 'en',
          targetLang: randomLang
        };

        translate(translateObj);
      } else {
        client.send('/morse_complete');
        firstSpeech = false;
        io.sockets.emit('speak', translateObj2); // change to Morse translation
      };
    }

    // send thermal print string to arduino
    if (data[0] == '^') {
      if (charCount == 0) {
        myPort.write('^');
      }
      if (thermStr.length > 0) {
        if (charCount < thermStrLen) {
          myPort.write(thermStr[charCount]);
          charCount++;
        } else {
          myPort.write('$');
          charCount = 0;
          thermStr = '';
        }
      }
    }

    // take pic
    if (data[0] == 'O') {
      // console.log('Taking photo');
      var printLines = Math.ceil(thermStrLen/32);
      setTimeout(function(){
        // console.log('taking photo in settimeout')
        takeOcrPhoto(printLines)
      }, 1000);
    }
  // }
}

function translate(data) {
  // io.emit('translate', data);

  googleTranslate.translate(data.str, data.sourceLang, data.targetLang, function(err, translation) {
    if (err) {
      if (phone1) {
        translatedStr = dictStr;
      } else {
        translatedStr = ocrString;
      };
    } else {
      translatedStr = translation.translatedText;
    };

    if (firstTranslation) {
      console.log(langDict[randomLang] + ': ' + translatedStr);
      translateObj = {
        str: translatedStr,
        sourceLang: randomLang,
        targetLang: 'en'
      };
      firstSpeech = true;
      io.sockets.emit('speak', translateObj);
      translate(translateObj);

    } else {
      // console.log(translatedStr);
      translateObj2 = {
        str: translatedStr,
        sourceLang: 'en'
      };
      if (phone1) {
        thermStr = translatedStr;
        thermStrLen = translatedStr.length;
        // sendSerialData('^');
      };
    };
    firstTranslation = false;
  });
}

    

function takeOcrPhoto(data) {
  io.emit('ocrPhoto', data);
}

function resetSystem() {
  // bothRaised = false;
  client.send('/server_starts');

  // reset arduino
  myPort.flush();

  dictStr = '';
  dotLengths = [];
  translatedStr = '';
  translateObj2 = {};
  ocrString = '';
  thermStr = '';
  thermStrLen = 0;
  firstSpeech = true;
  phone1 = true;
  listening = true;
  charCount = 0;
  firstTranslation = true;
  translateObj = {};
  inCharTypeSent = false;
}

function showPortClose() {
  console.log('port closed.');
}

function showError(error) {
  console.log('Serial port error: ' + error);
}

// Send it to all other clients
// socket.broadcast.emit('morse', data);

// Send to everyone including sender
// io.sockets.emit('message', "this goes to everyone");