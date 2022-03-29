const { Rect } = require("opencv4nodejs");

// reason to choose DNN : https://learnopencv.com/face-detection-opencv-dlib-and-deep-learning-c-python/
// Another reference :
// - https://theailearner.com/tag/cv2-laplacian/
// - https://cse442-17f.github.io/Sobel-Laplacian-and-Canny-Edge-Detection-Algorithms/#
let countNotFace = 0;

class dnn {
    constructor(cv){
        this.cv = cv

        this.framework = "caffe";

        // https://github.com/spmallick/learnopencv/tree/master/FaceDetectionComparison/models
        const caffeConfigFile = `${__dirname}/../model/deploy.prototxt`;
        const caffeWeightFile = `${__dirname}/../model/res10_300x300_ssd_iter_140000_fp16.caffemodel`;
        const tensorflowConfigFile = `${__dirname}/../model/opencv_face_detector.pbtxt`;
        const tensorflowWeightFile = `${__dirname}/../model/opencv_face_detector_uint8.pb`;

        if (this.framework == "caffe"){
            this.net = cv.readNetFromCaffe(caffeConfigFile, caffeWeightFile);

        }else{
            this.net = cv.readNetFromTensorflow(
                tensorflowWeightFile,
                tensorflowConfigFile
            );
        }
    }
    
    
    //get accuration
    accuration(){
        
    }


    detectObject(frame){
        const cv = this.cv;
        // const rawFrame = frame.copy();
        
        const confidenceThreshold = 0.5;
        const inScaleFactor = 1;
        
        const blob = cv.blobFromImage(
            frame,
            inScaleFactor,
            new cv.Size(300, 300),
            new cv.Vec3(104, 117, 123),
            this.framework != "caffe",
            false
        );

        const round = (val, power) =>
          Math.round((val + Number.EPSILON) * Math.pow(10, power)) /
          Math.pow(10, power);
        
        this.net.setInput(blob, "data");
        const detection = this.net.forward("detection_out");
        const detectionMat = new cv.Mat(
            detection.sizes[2],
            detection.sizes[3],
            cv.CV_32F,
            detection
        );
        
        let detectedObjects = {};
        let isFaceFound = false;

        for (let i = 0; i < detectionMat.rows; i +=7) {
            const confidence = detectionMat.at(i, 2);
            
            if (confidence > confidenceThreshold && !isFaceFound) {
                let idx = detectionMat.at(i, 1);
                let x1 = detectionMat.at(i, 3) * frame.cols;
                let y1 = detectionMat.at(i, 4) * frame.rows;
                let x2 = detectionMat.at(i, 5) * frame.cols;
                let y2 = detectionMat.at(i, 6) * frame.rows;
                let height = y2-y1;
                let width = x2-x1;
                
                detectedObjects = {
                  x1,
                  y1,
                  x2,
                  y2,
                  height,
                  width,
                  cols: frame.cols,
                  row: frame.rows,
                  detections: detectionMat.rows,
                  confidence,
                };
                
                // console.log(idx, detectedObjects);
                
                if(x1 > 0 && y1 > 0 && x2 > 0 && y2 > 0){
                    // Get head based on edge
                    detectedObjects.detectedEdge = this.detectedEdge({
                      x1,
                      y1,
                      x2,
                      y2,
                      frame,
                    });

                    // rectangle for face
                    frame.drawRectangle(
                        // new cv.Point2(x1, y1),
                        // new cv.Point2(x2, y2),
                        new cv.Rect(
                            x1,
                            y1,
                            width,
                            height
                        ),
                        new cv.Vec3(0, 255, 0),
                        2,
                        4
                    );

                    // rectangle for hair
                    frame.drawRectangle(
                        new cv.Rect(
                            x1,
                            detectedObjects.detectedEdge.nearedEdgeIndex,
                            width,
                            y1 - detectedObjects.detectedEdge.nearedEdgeIndex
                        ),
                        new cv.Vec3(0, 0, 255),
                        2,
                        4
                    );
                    

                    isFaceFound = true;
                }
            }
        }   

        // stabilize face detection
        if (isFaceFound) {
            countNotFace = 0;
        } else {
            countNotFace++;
        }

        let sentImage = false
        if(countNotFace == 0 || countNotFace > 5){
            sentImage = true;
        }


        return {
            isSent: sentImage,
            frame,
            info: detectedObjects
        };
    }




    detectedEdge({x1, y1, x2, y2, frame}){
        const cv = this.cv;

        // Crop frame in dimension = 3 : y
        const xCenter = (x1 + x2) / 2;
        
        let croppedFrame = frame.copy();

        const cropArea = {
            x: xCenter - 1,
            y: 0,
            width: 3,
            height: y1
        }

        if (
            0 > cropArea.x ||
            0 > cropArea.width ||
            cropArea.x + cropArea.width > croppedFrame.cols ||
            0 > cropArea.y ||
            0 > cropArea.height ||
            cropArea.y + cropArea.height > croppedFrame.rows
        ) {
            console.log("crop area not valid");
            return {};
        }

        croppedFrame = croppedFrame.getRegion(
          new cv.Rect(cropArea.x, cropArea.y, cropArea.width, cropArea.height)
        );

        if (croppedFrame.rows <= 0 || croppedFrame.cols <= 0) {
            console.log("crop area is empty");
            return {};
        }


        // grayscale and blur it, to smooth image
        croppedFrame = croppedFrame.cvtColor(cv.COLOR_BGR2GRAY);
        croppedFrame = croppedFrame.gaussianBlur(new cv.Size(25, 25), 0);
        // croppedFrame = croppedFrame.laplacian(cv.CV_64F);

        // measure intensity per pixel
        let mid = [];
        let means = 0;
        let counter = 0;

        mid[0] = 0;
        for (let lIndex = 1; lIndex < croppedFrame.rows; lIndex++) {
            let newMid = Math.abs(croppedFrame.at(lIndex, 1));
            let oldMid = Math.abs(croppedFrame.at(lIndex - 1, 1));
            const subMid = Math.abs(newMid - oldMid);

            if (subMid > 0) {
                means += subMid;
                counter++;
            }
            mid.push(subMid);
        }

        means = Math.ceil(means / counter);


        // get second means of intensity to get neared edge from face (filtering)

        let means2 = 0;
        let counter2 = 0;
        for (let lIndex = 0; lIndex < mid.length; lIndex++) {
            if(mid[lIndex] < means){
                mid[lIndex] = 0;
            }else{
                means2 += mid[lIndex];
                counter2++;
            }
        }

        means2 = Math.ceil(means2 / counter2);

        for (let lIndex = 0; lIndex < mid.length; lIndex++) {
            if(mid[lIndex] < means2){
                mid[lIndex] = 0;
            }
        }

        let nearedEdgeIndex = 0;
        for (let lIndex = mid.length - 3; lIndex >= 2; lIndex--) {
            if (mid[lIndex] != 0) {
                nearedEdgeIndex = lIndex;
                break;
            }
        }

        // console.log(
        //     means,
        //     means2,
        //     `${nearedEdgeIndex}/${croppedFrame.rows}`,
        //     croppedFrame.rows,
        //     mid.length,
        //     JSON.stringify(mid)
        // );

        if((y2 - y1) / 2 < y1 - nearedEdgeIndex){
            console.log("your hair is too high, perhaps it's not your hair");
            return {};
        }

        return {
            means,
            means2,
            nearedEdgeIndex,
            fullHeight: croppedFrame.rows,
        };
    }


}

module.exports = dnn
