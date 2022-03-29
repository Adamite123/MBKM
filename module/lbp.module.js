/**
 * For now I use face over eyes due to face has more feature than eye.
 * Therefore "Face" that i mean is only include your eye, nose and mouth.
 * In opencv that "Face" exactly similar to model LBP_FRONTALFACE_IMPROVED.
 * One more, LBP_FRONTALFACE_IMPROVED more stable than 
 * Why I chose model LBP_FRONTALFACE_IMPROVED ?
 * It's more stable than face (HAAR_FRONTALFACE_DEFAULT) and eye (HAAR_EYE)
 */

class lbp {
    constructor(cv){
        this.cv = cv
    }
    
    // Set rectangle template
    drawRect({image, rect, color, opts = { thickness: 2 }}){
        image.drawRectangle(rect, color, opts.thickness, this.cv.LINE_8);
    }
    
    detectObject(frame){
        const cv = this.cv
        let isFace = false
        let info = {}
        
        const faceClassifier = new cv.CascadeClassifier(
            cv.LBP_FRONTALFACE_IMPROVED
        );
        
        const fullFaceClassifier = new cv.CascadeClassifier(cv.LBP_FRONTALFACE);
        // const eyeClassifier = new cv.CascadeClassifier(cv.HAAR_EYE);
        
        // detect faces
        const faceResult = faceClassifier.detectMultiScale(frame.bgrToGray());
        const fullFaceResult = fullFaceClassifier.detectMultiScale(
            frame.bgrToGray()
        );
        
        if (!faceResult.objects.length || !fullFaceResult.objects.length) {
            console.error("No faces detected!");
        } else {
            const sortByNumDetections = (result) =>
            result.numDetections
            .map((num, idx) => ({ num, idx }))
            .sort((n0, n1) => n1.num - n0.num)
            .map(({ idx }) => idx);
            
            // get best result
            const faceRect = faceResult.objects[sortByNumDetections(faceResult)[0]];
            const fullFaceRect = fullFaceResult.objects[sortByNumDetections(fullFaceResult)[0]];
            
            info.faceRect = faceRect;
            info.fullFaceRect = fullFaceRect;
            // console.log("faceRects:", faceResult.objects);
            // console.log("confidences:", faceResult.numDetections);
            
            // detect eyes
            // const faceRegion = frame.getRegion(faceRect);
            // const eyeResult = eyeClassifier.detectMultiScale(faceRegion);
            // console.log("eyeRects:", eyeResult.objects);
            // console.log("confidences:", eyeResult.numDetections);
            
            // // get best result
            // const eyeRects = sortByNumDetections(eyeResult)
            // .slice(0, 2)
            // .map((idx) => eyeResult.objects[idx]);
            
            // // draw face detection
            this.drawRect({
                image: frame,
                rect: faceRect,
                color: new cv.Vec(0, 255, 0),
            });
            
            this.drawRect({
                image: frame,
                rect: fullFaceRect,
                color: new cv.Vec(0, 0, 255),
            });
            
            // // draw eyes detection in face region
            // eyeRects.forEach((eyeRect) => drawGreenRect(faceRegion, eyeRect));
            
            isFace = true;
        }
        
        return {
            isSent: true,
            isFace,
            frame,
            info
        }
    }
}

module.exports = lbp
