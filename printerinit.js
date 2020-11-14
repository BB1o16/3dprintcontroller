const SerialPort = require('serialport');
const Readline = SerialPort.parsers.Readline
const parser = new Readline()

const sp = new SerialPort('COM3', {
    baudRate: 115200,
    parser: new SerialPort.parsers.Readline('\r\n')
});

const on = sp.on("open", function () {
    console.log('Connected!');

    sp.pipe(parser)

    parser.on('data', console.log)
});
