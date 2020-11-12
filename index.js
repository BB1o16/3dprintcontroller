//const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const path = require('path');
const cv = require('opencv4nodejs');
const app = require('express')();
const server = require('http').createServer(app);
const io = require('socket.io')(server);

const wCap = new cv.VideoCapture(0);

app.use(session({
    secret: 'secret',
    resave: true,
    saveUninitialized: true
}));
app.use(bodyParser.urlencoded({extended : true}));
app.use(bodyParser.json());

app.get('/', function(request, response) {
    response.sendFile(path.join(__dirname + '/index.html'));
});

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
            response.send('Incorrect Username and/or Password!');
        }
        response.end();
    } else {
        response.send('Please enter Username and Password!');
        response.end();
    }
});

app.get('/home', function(request, response) {
    if (request.session.loggedin) {
        response.send('Welcome back, ' + request.session.username + '!');
    } else {
        response.send('Please login to view this page!');
    }
    response.end();
});

setInterval(() => {
    const frame = wCap.read();
    const image = cv.imencode('.jpg', frame).toString('base64');
    io.emit('image', image);
}, 1000)

server.listen(3000);