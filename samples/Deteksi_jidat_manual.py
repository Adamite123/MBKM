import face_recognition
import cv2
import PIL.Image
import PIL.ImageDraw
import os

# image=cv2.imread(img_path)
unknown_image = face_recognition.load_image_file("gambar/trisno.jpeg")
face_locations = face_recognition.face_locations(unknown_image) # detects all the faces in image
# cv2.imshow('frame', im)
# cv2.waitKey(5000)

#------- PEMBATAS --------
t = len(face_locations)
# print(len(face_locations))
# print(face_locations)

# Get the locations and outlines of each person’s eyes, nose, mouth and chin.
face_landmarks_list = face_recognition.face_landmarks(unknown_image)

# Drawing rectangles over the faces
pil_image = PIL.Image.fromarray(unknown_image)

for face_location in face_locations:
    # print(face_location)
    top,right,bottom,left =face_location
    draw_shape = PIL.ImageDraw.Draw(pil_image)
    im = PIL.Image.open("gambar/trisno.jpeg")
    # cv2.imshow('frame', im)
    # cv2.waitKey(5000)

    #bottom=34
    k = face_landmarks_list[0]['right_eyebrow']
    bottom= face_landmarks_list[0]['right_eyebrow'][0][1]

    for k1 in k :   
        if(bottom>k1[1]):
            bottom=k1[1]
    k = face_landmarks_list[0]['left_eyebrow']
    lbottom= face_landmarks_list[0]['left_eyebrow'][0][1]

    for k1 in k :   
        if(lbottom>k1[1]):
            lbottom=k1[1]
            
    bottom=min(bottom,lbottom)
    print(bottom)
    im = im.crop((left, top, right, bottom))
    im.save("hasil_jidat/hasil.jpg")    
    draw_shape.rectangle([left, top, right, bottom],outline="blue")