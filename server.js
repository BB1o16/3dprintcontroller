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
const util = require('util');

app.use(session({
    secret: 'secret',
    resave: true,
    saveUninitialized: true
}));

let printStatus = false;
let isPaused = false;

"use strict";

// Printer Settings /dev/ttyUSB0
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
    response.sendFile(path.join(__dirname + '/public/app/views/index.html'));
});

// Get Home Page
app.get('/home', function(request, response) {
    response.sendFile(path.join(__dirname + '/public/app/views/home.html'));
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
app.post('/upload', function(request, response) {
    let sampleFile;
    let uploadPath;

    if (!request.files || Object.keys(request.files).length === 0) {
        response.status(400).send('No files were uploaded.');
        return;
    } else {
        console.log('request.files >>>', request.files); // eslint-disable-line

        sampleFile = request.files.sampleFile;

        uploadPath = __dirname + '/public/storage/' + sampleFile.name;

        sampleFile.mv(uploadPath, function(err) {
            if (err) {
                return response.status(500).send(err);
            }

            printFile(uploadPath);
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

// Print
function printFile(path) {
    let array = [  'M140 S50',
        'M105',
        'M190 S50',
        'M104 S200',
        'M105',
        'M109 S200',
        'M82 ',
        'G92 E0 ',
        'G28 ',
        'G1 Z2.0 F3000 ',
        'G1 X0.1 Y20 Z0.3 F5000.0 ',
        'G1 X0.1 Y200.0 Z0.3 F1500.0 E15 ',
        'G1 X0.4 Y200.0 Z0.3 F5000.0 ',
        'G1 X0.4 Y20 Z0.3 F1500.0 E30 ',
        'G92 E0 ',
        'G1 Z2.0 F3000 ',
        'G1 X5 Y20 Z0.3 F5000.0 ',
        'G92 E0',
        'G92 E0',
        'G1 F2700 E-5',
        'M107',
        'G0 F6000 X77.833 Y95.204 Z0.2',
        'G1 F2700 E0',
        'G1 F1200 X77.997 Y95.073 E0.00698',
        'G1 X78.754 Y94.52 E0.03816',
        'G1 X79.319 Y94.166 E0.06034',
        'G1 X79.487 Y94.068 E0.06681',
        'G1 X80.317 Y93.631 E0.098',
        'G1 X80.851 Y93.395 E0.11742',
        'G1 X81.131 Y93.28 E0.12749',
        'G1 X82.013 Y92.961 E0.15869',
        'G1 X82.773 Y92.751 E0.18491',
        'G1 X83.119 Y92.669 E0.19674',
        'G1 X84.04 Y92.492 E0.22793',
        'G1 X84.716 Y92.413 E0.25057',
        'G1 X85.357 Y92.358 E0.27197',
        'G1 X85.63 Y92.338 E0.28107',
        'G1 X108.156 Y90.97 E1.03167',
        'G1 X108.851 Y90.936 E1.05481',
        'G1 X109.142 Y90.926 E1.0645',
        'G1 X109.947 Y90.908 E1.09128',
        'G1 X110.365 Y90.906 E1.10518',
        'G1 X110.786 Y90.917 E1.11919',
        'G1 X111.282 Y90.938 E1.1357',
        'G1 X111.622 Y90.957 E1.14703',
        'G1 X112.14 Y90.995 E1.1643',
        'G1 X112.456 Y91.023 E1.17485',
        'G1 X112.993 Y91.078 E1.19281',
        'G1 X113.295 Y91.113 E1.20292',
        'G1 X113.64 Y91.158 E1.21449',
        'G1 X113.94 Y91.202 E1.22457',
        'G1 X114.167 Y91.238 E1.23222',
        'G1 X114.497 Y91.295 E1.24336',
        'G1 X115.234 Y91.435 E1.26831',
        'G1 X115.541 Y91.498 E1.27873',
        'G1 X115.755 Y91.545 E1.28602',
        'G1 X116.038 Y91.611 E1.29568',
        'G1 X116.64 Y91.76 E1.31631',
        'G1 X117.098 Y91.884 E1.33209',
        'G1 X117.663 Y92.05 E1.35168',
        'G1 X118.107 Y92.191 E1.36717',
        'G1 X118.668 Y92.382 E1.38688',
        'G1 X119.103 Y92.54 E1.40228',
        'G1 X119.541 Y92.71 E1.4179',
        'G1 X119.823 Y92.824 E1.42802',
        'G1 X120.375 Y93.056 E1.44794',
        'G1 X120.896 Y93.291 E1.46695',
        'G1 X121.652 Y93.656 E1.49487',
        'G1 X121.985 Y93.824 E1.50727',
        'G1 X122.301 Y93.99 E1.51914',
        'G1 X122.778 Y94.251 E1.53723',
        'G1 X123.117 Y94.445 E1.55022',
        'G1 X123.346 Y94.582 E1.5591',
        'G1 X123.777 Y94.848 E1.57594',
        'G1 X123.972 Y94.971 E1.58361',
        'G1 X124.269 Y95.163 E1.59537',
        'G1 X124.528 Y95.336 E1.60573',
        'G1 X124.995 Y95.657 E1.62458',
        'G1 X125.414 Y95.959 E1.64176',
        'G1 X125.866 Y96.302 E1.66063',
        'G1 X126.138 Y96.516 E1.67214',
        'G1 X126.611 Y96.899 E1.69238',
        'G1 X126.852 Y97.1 E1.70282',
        'G1 X127.014 Y97.239 E1.70992',
        'G1 X127.221 Y97.421 E1.71909',
        'G1 X127.488 Y97.662 E1.73105',
        'G1 X127.654 Y97.815 E1.73856',
        'G1 X128.023 Y98.162 E1.75541',
        'G1 X128.289 Y98.42 E1.76773',
        'G1 X128.586 Y98.725 E1.78189',
        'G1 X128.979 Y99.144 E1.801',
        'G1 X129.243 Y99.435 E1.81407',
        'G1 X129.827 Y100.104 E1.8436',
        'G1 X130.062 Y100.382 E1.85571',
        'G1 X130.333 Y100.714 E1.86996',
        'G1 X130.634 Y101.101 E1.88627',
        'G1 X130.972 Y101.555 E1.9051',
        'G1 X131.123 Y101.762 E1.91362',
        'G1 X131.448 Y102.224 E1.93241',
        'G1 X131.559 Y102.387 E1.93897'];

    (async function () {
        await myPrinter.sendGCode(array);
        console.log(array);

    })();

    fs.readFile(path, function (err, data) {
        // if (err) throw err;
        // let text = data.toString().split("\r\n");


        // (async function () {
        //     // for (let i = 0; i < text.length; i++) {
        //     //     if (text[i].charAt(0) == ';') {
        //     //         text[i] = text[i].slice(1, 0);
        //     //     }
        //     //     text[i] = text[i].split(';').slice(0,1).pop();
        //     // }
        //     //
        //     // //text = text.filter((v) => v != '')
        //     await myPrinter.sendGCode(array);
        //     console.log(array);

        //})();
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