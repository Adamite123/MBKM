class calibrator{

    constructor(cv){
        this.cv = cv;
    }

    detect(frame){
        const cv = this.cv;


        // Creating contour to track color
        const findColor = (mask, colorName) => {

            const contours = mask.findContours(
                cv.RETR_EXTERNAL,
                cv.CHAIN_APPROX_SIMPLE
            );

            const new_contours = []
            for(let contour of contours ){
                if (contour.area > 300) {

                    const rect = contour.boundingRect();

                    new_contours.push({
                        color: colorName,
                        rect,
                    });
                }
            }
            return new_contours;
        }


        // Sort based on Y
        const sortY = (array) => {
            const result = []

            for(let content of array ){
                const length = result.length;

                if (!length){
                    result.push(content);

                }else{
                    let foundIndex = 0;
                    for(let index = length - 1; index >= 0; index--){
                        if (content.rect.y < result[index].rect.y) {
                            continue;
                        }else{
                            foundIndex = index + 1;
                            break;
                        }
                    }
                    result.splice(foundIndex, 0, content);
                }
            }
            return result;
        }


        // Filter contours based on alternate color (selang-seling) and their neighbor-distance 
        const filterAlternateColor = (array, toleredDistanceY, toleredDistanceX) => {

            let result = []
            let lastColor = null;
            let lastHeight = 0;
            let lastX = 0;

            for(let content of array){
                if(!lastColor){
                    result.push(content);
                    lastColor = content.color
                    lastHeight = content.rect.height + content.rect.y;
                    lastX = content.rect.x;
                    continue;
                }

                console.log(
                  Math.abs(lastHeight - content.rect.y)
                );

                if (
                    content.color == lastColor ||
                    Math.abs(lastHeight - content.rect.y) > toleredDistanceY ||
                    Math.abs(lastX - content.rect.x) > toleredDistanceX
                ) {
                  result = [];
                }
                result.push(content)

                lastColor = content.color;
                lastHeight = content.rect.height + content.rect.y;
                lastX = content.rect.x;
            }

            if(result.length <= 1){
                result = [];
            }

            return result;
        }



        //Pemberian warna pada contours
        const red_mask = frame.inRange(
            new cv.Vec3(150, 120, 170), //BGR
            new cv.Vec3(255, 170, 240)  //BGR
        );

        const red_contours = findColor(red_mask, "red");

        const yellow_mask = frame.inRange(
            new cv.Vec3(170, 210, 200), //BGR
            new cv.Vec3(225, 255, 245) //BGR
        );

        const yellow_contours = findColor(yellow_mask, "yellow");

        

        // Combine red & yellow and order them based on Y
        if(!red_contours.length || !yellow_contours.length){
            return {
                frame
            }
        }

        let combined_contours = [
            ...JSON.parse(JSON.stringify(red_contours)), 
            ...JSON.parse(JSON.stringify(yellow_contours))
        ];

        const toleredNeighborDistanceY = 5; // in pixel
        const toleredNeighborDistanceX = 30; // in pixel

        combined_contours = sortY(combined_contours);
        combined_contours = filterAlternateColor(
            combined_contours,
            toleredNeighborDistanceY,
            toleredNeighborDistanceX
        );

        for(let contour of combined_contours){
            frame.drawRectangle(
                new cv.Rect(
                    contour.rect.x,
                    contour.rect.y,
                    contour.rect.width,
                    contour.rect.height
                ),
                contour.color == "yellow"
                    ? new cv.Vec3(0, 255, 0)
                    : new cv.Vec3(0, 0, 255),
                2,
                4
            );
        }

        if(!combined_contours.length){
            return {
                frame
            }
        }

        // Draw line between edge
        const startPoint = new cv.Point2(
            combined_contours[0].rect.x + combined_contours[0].rect.width / 2,
            combined_contours[0].rect.y
        );

        const endPoint = new cv.Point2(
            combined_contours[combined_contours.length].rect.x + combined_contours[combined_contours.length].rect.width / 2,
            combined_contours[combined_contours.length].rect.y + combined_contours[combined_contours.length].rect.width
        );

        frame.drawLine(startPoint, endPoint, new cv.Vec(0,255,0));

        console.log(combined_contours.length, combined_contours);


        return {
            frame
        }
        
    }
}

module.exports = calibrator
