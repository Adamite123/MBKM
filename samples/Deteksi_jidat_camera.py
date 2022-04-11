# import the opencv library
import cv2

#import library lainnya
import face_recognition
import PIL.Image
import PIL.ImageDraw
import os


# define a video from esp32(camera module)
# vid = cv2.VideoCapture('http://192.168.1.12:81/stream')

# define a video from webcam
vid = cv2.VideoCapture(0)

while(True):
	
	# Capture the video frame
	# by frame
	ret, frame = vid.read()

	# Display the resulting frame
	cv2.imshow('frame', frame)
	
	# the 'q' button is set as the
	# quitting button you may use any
	# desired button of your choice
	if cv2.waitKey(1) & 0xFF == ord('q'):
		break

# After the loop release the cap object
vid.release()
# Destroy all the windows
cv2.destroyAllWindows()
