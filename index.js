const express = require('express');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);

const path = require("path");

const cv = require("opencv4nodejs");
const _m$ObjectDetection = require("./module/dnn.module.js");
const m$ObjectDetection = new _m$ObjectDetection(cv);
const _m$Calibration = require("./module/calibration.module.js");
const m$Calibration = new _m$Calibration(cv);
    
// const FRAME_WIDTH = 1024;
// const FRAME_HEIGHT = 576;

const FRAME_WIDTH = 640;
const FRAME_HEIGHT = 480;

const MODE = "NORMAL"; // ["CALIBRATION", "NORMAL"]

// Capture camera
const wCap = new cv.VideoCapture(0);
const round = (val, power) =>
  Math.round((val + Number.EPSILON) * Math.pow(10, power)) /
  Math.pow(10, power);

// Setting the height and width of object (16:9)
wCap.set(cv.CAP_PROP_FRAME_WIDTH, FRAME_WIDTH);
wCap.set(cv.CAP_PROP_FRAME_HEIGHT, FRAME_HEIGHT);

app.get('/', (req, res)=>{
    res.sendFile(path.join(__dirname, 'public/index.html'));
});

patokan = 0;

// Using setInterval to read the image every one second.
setInterval(()=>{

    
    // Reading image from video capture device
    let frame = wCap.read();

    if(frame){

        if(MODE == "NORMAL"){
            const resultDetection = m$ObjectDetection.detectObject(frame);
            // console.log(resultDetection.info);
            frame = resultDetection.frame;
    
            // Encoding the image with base64.
            if(resultDetection.isSent){
                const image = cv.imencode(".jpg", frame).toString("base64");
                io.emit("image", image);
            }
    
            io.emit("info", JSON.stringify(resultDetection.info));
            
        }else if (MODE == "CALIBRATION") {
            const resultDetection = m$Calibration.detect(frame);
            // console.log(resultDetection.info);
            frame = resultDetection.frame;

            // Encoding the image with base64.
            const image = cv.imencode(".jpg", frame).toString("base64");
            io.emit("image", image);
        }
    }
}, 10)

server.listen(3000);
    
