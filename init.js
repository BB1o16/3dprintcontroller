import {Printer} from "3d-printer-controller";

(async () => {
    const myPrinter = new Printer("COM6", 115200, {x: 220, y: 220, z: 300});
    await myPrinter.init();
})();
