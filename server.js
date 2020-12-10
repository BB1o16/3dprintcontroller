const session = require('express-session');
const bodyParser = require('body-parser');
const path = require('path');
const cv = require('opencv4nodejs');
const express = require("express");
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);
const wCap = new cv.VideoCapture(0);
const fileUpload = require('express-fileupload');
const fs = require('fs');
const _dPrinterController = require("3d-printer-controller");

app.use(session({
    secret: 'secret',
    resave: true,
    saveUninitialized: true
}));

let printStatus = false;
let isPaused = false;

"use strict";

// Printer Settings /dev/ttyUSB0 for Raspberry Pi
const myPrinter = new _dPrinterController.Printer("/dev/ttyUSB0", 115200, {
    x: 220,
    y: 220,
    z: 250
});

// Initialize 3d Printer
(async function () {
    await myPrinter.init();
})();

// Parse POST Data
app.use(bodyParser.urlencoded({extended : true}));
app.use(bodyParser.json());

app.set('view engine', 'ejs');

// Get Login Page
app.get('/', function(request, response) {
    response.sendFile(path.join(__dirname + '/src/index.html'));
});

// Get Home Page
app.get('/home', function(request, response) {
    response.sendFile(path.join(__dirname + '/src/home.html'));
});

// Authentication
app.post('/auth', function(request, response) {
    const username = request.body.username;
    const password = request.body.password;
    let success;
    if (username === 'admin' && password === 'admin') {
        success = true;
        if (success === success) {
            request.session.loggedin = true;
            request.session.username = username;
            response.redirect('/home');
        } else {
            response.send('Please enter Username and Password!');
        }
        response.end();
    } else {
        response.send('Incorrect Username and/or Password!');
        response.end();
    }
});

app.use(fileUpload());

// Upload
app.post('/print',(request, response) => {
    let sampleFile;
    let uploadPath;

    if (!request.files || Object.keys(request.files).length === 0) {
        response.status(400).send('No files were uploaded.');
        return;
    } else {
        console.log('request.files >>>', request.files); // eslint-disable-line

        sampleFile = request.files.file;

        uploadPath = __dirname + '/storage/' + sampleFile.name;

        sampleFile.mv(uploadPath, function(err) {
            if (err) {
                return response.status(500).send(err);
            }

            printFile(uploadPath);
            printStatus = true;
        });
    }
});

// Stop
app.post('/stop', function (request, response) {
    if (printStatus == true) {
        (async function () {
             const stopCommands = ['M140 S0', 'M107', 'G91', 'G1 E-2 F2700', 'G1 E-2 Z0.2 F2400',
                'G1 X5 Y5 F3000', 'M106 S0', 'M104 S0', 'M140 S0', 'M84 X Y E'];
            await myPrinter.sendGCode(stopCommands);
            console.log("Printer is Stopping...");
            console.log(stopCommands);
            printStatus = false;
        })();
    } else {
        response.send('The printer is not started, can not stop.');
    }
})

// Pause
app.post('/pause', function (request, response) {
    if (printStatus == true && isPaused == false) {
        (async function () {
            const pauseCommands = ['M117'];
            await myPrinter.sendGCode(pauseCommands);
            console.log("Printer is Pausing...");
            console.log(pauseCommands);
            isPaused = true;
        })();

    } else {
        response.send('The printer is not started, can not pause.');
    }

})

// Start
app.post('/start', function (request, response) {
   if (printStatus == true && isPaused == true) {
        (async function () {
            const pauseCommands = ['M117'];
            await myPrinter.sendGCode(pauseCommands);
            console.log("Printer is Starting...");
            console.log(pauseCommands);
            isPaused = false;
        })();
    } else {
       response.send('The printer is not started, upload document first.');
   }
})

// Warm
app.post('/warm', function (request, response) {
    if (printStatus == false) {
        (async function () {
            const warmCommands = ['M140 S25', 'M105', 'M190 S25', 'M104 S50', 'M105', 'M109 S50'];
            await myPrinter.sendGCode(warmCommands);
            console.log("Printer is Warming...");
            console.log(warmCommands);
            printStatus = true;
        })();
    } else {
        response.send('The printer is started, can not warm.');
    }
})

// Print
function printFile(path) {
    fs.readFile(path, function (err, data) {
        if (err) throw err;
        let text = data.toString().split("\r\n");

        for (let i = 0; i < text.length; i++) {
            if (text[i].charAt(0) == ';') {
                text[i] = text[i].slice(1, 0);
            }
            text[i] = text[i].split(';').slice(0,1).pop();
            console.log(text[i]);
        }

        text = text.filter((v) => v != '');

        (async function () {
            await myPrinter.sendGCode(text);
        })();
    })
}

// Live Feed
io.on('connection', function (socket) {
    console.log("Connected to  the socket successfully");

    setInterval(() => {
        const frame = wCap.read();
        const image = cv.imencode('.jpg', frame).toString('base64');
        socket.emit('image', image);
    }, 100)
})

server.listen(3000, function () {
    console.log(`Server listening on port ${3000}`);
});