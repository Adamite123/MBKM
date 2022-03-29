# Face Detection

## Installation
1. Installation was tested in osx catalina
2. Before installation, please ensure that you not installed opencv on your machine
3. Make sure that your node version is 15.11.0 ( Installation was failed on version 17 and 14, don't know why )
4. And make sure your npm version is 6.14.11 ( npm i -g npm@6.14.11, don't know why again )
5. Execute command below or add it at bottom of ~/.zshrc or ~/.bashrc
```
export OPENCV4NODEJS_AUTOBUILD_FLAGS=-DBUILD_LIST=core,imgproc,imgcodecs,videoio,highgui,video,calib3d,features2d,objdetect,dnn,ml,flann,photo,stitching,gapi
```
6. Finally, install main modules
```
npm i -g opencv-build
npm i -g opencv4nodejs
``` 

Reference :
1. https://github.com/justadudewhohacks/opencv4nodejs/issues/775#issuecomment-878141077
