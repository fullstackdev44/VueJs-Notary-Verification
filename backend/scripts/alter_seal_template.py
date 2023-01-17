from PIL import Image
from PIL import ImageFont
from PIL import ImageDraw
from datetime import datetime
import sys
import os

img = Image.open(sys.argv[5])
draw = ImageDraw.Draw(img)
print(sys.argv)
expireDate = datetime.fromtimestamp(int(sys.argv[4])).strftime('%m/%d/%Y')
print(expireDate)
print("starting!!")

noSealTemplates = [
    "Alabama.jpg", 
    "Alabama.png", 
    "Alaska.png", 
    "Alaska.jpg", 
    "American Samoa.png", 
    "American Samoa.jpg", 
    "Arkansas.png", 
    "Arkansas.jpg", 
    "California.png", 
    "California.jpg", 
    "Colorado.png", 
    "Colorado.jpg", 
    "Delaware.png", 
    "Delaware.jpg", 
    "District Of Columbia.png", 
    "District Of Columbia.jpg", 
    "Georgia.png", 
    "Georgia.jpg", 
    "Guam.png", 
    "Guam.jpg", 
    "Hawaii.png", 
    "Hawaii.jpg", 
    "Idaho.png", 
    "Idaho.jpg", 
    "Illinois.png", 
    "Illinois.jpg", 
    "Indiana.png", 
    "Indiana.jpg", 
    "Iowa.png", 
    "Iowa.jpg", 
    "Kansas.png", 
    "Kansas.jpg", 
    "Kentucky.png", 
    "Kentucky.jpg", 
    "Louisiana.png", 
    "Louisiana.jpg", 
    "Maine.png", 
    "Maine.jpg", 
    "Maryland.png", 
    "Maryland.jpg", 
    "Massachusetts.png", 
    "Massachusetts.jpg", 
    "Mississippi.png", 
    "Mississippi.jpg", 
    "Missouri.png", 
    "Missouri.jpg", 
    "Nebraska.png", 
    "Nebraska.jpg", 
    "Nevada.png", 
    "Nevada.jpg", 
    "New Hampshire.png", 
    "New Hampshire.jpg", 
    "New Jersey.png", 
    "New Jersey.jpg", 
    "New York.png", 
    "New York.jpg", 
    "North Carolina.png", 
    "North Carolina.jpg", 
    "North Dakota.png", 
    "North Dakota.jpg", 
    "Oklahoma.png", 
    "Oklahoma.jpg", 
    "Pennsylvania.png", 
    "Pennsylvania.jpg", 
    "Puerto Rico.png", 
    "Puerto Rico.jpg", 
    "Rhode Island.png", 
    "Rhode Island.jpg", 
    "South Carolina.png", 
    "South Carolina.jpg", 
    "South Dakota.png", 
    "South Dakota.jpg", 
    "Vermont.png", 
    "Vermont.jpg", 
    "Washington.png", 
    "Washington.jpg", 
    "West Virginia.png", 
    "West Virginia.jpg", 
    "Wisconsin.png", 
    "Wisconsin.jpg", 
    "Wyoming.png",
    "Wyoming.jpg"
]

currentTemplate = os.path.basename(sys.argv[5])
if currentTemplate in noSealTemplates:
    startx = 0
else:
    startx = 170

x, y = [startx, 28]

# For Tenesse we need to show state of Tennessee above electric notary text so we have added if else here
# For Tennessee we capture county and show it it extra next line
# For Tennessee we change Electronic to Online
# For Virginia we rename State with Commonwealth
# For Idaho we skip the commission expiry date. So its 4 lines only

if sys.argv[1] == "Tennessee":
    x, y = [startx, 16]
if sys.argv[1] == "Idaho":
    x, y = [startx, 40]

font = ImageFont.truetype("public/fonts/OpenSans-Regular.ttf", 20)

w1, h1 = draw.textsize(sys.argv[2], font=font)
x1 = (500 - x - w1) / 2
draw.text((x + x1, y), sys.argv[2], (0, 0, 0), font=font)

deltaY = 25

if sys.argv[1] == "Tennessee":
    w3, h3 = draw.textsize(sys.argv[1] + ' Notary Public', font=font)
    x3 = (500 - x - w3) / 2
    draw.text((x + x3, y + deltaY), sys.argv[1] + ' Notary Public', (0, 0, 0), font=font)

    deltaY += 25

    w2, h2 = draw.textsize('Online Notary Public', font=font)
    x2 = (500 - x - w2) / 2
    draw.text((x + x2, y + deltaY), 'Online Notary Public', (0, 0, 0), font=font)

else:
    if sys.argv[1] == "Idaho":
        w2, h2 = draw.textsize('NOTARY PUBLIC', font=font)
        x2 = (500 - x - w2) / 2
        draw.text((x + x2, y + deltaY), 'NOTARY PUBLIC', (0, 0, 0), font=font)
    elif sys.argv[1] == "Kentucky":
        w2, h2 = draw.textsize('Online Notary Public', font=font)
        x2 = (500 - x - w2) / 2
        draw.text((x + x2, y + deltaY), 'Online Notary Public', (0, 0, 0), font=font)
    else:
        w2, h2 = draw.textsize('Electronic Notary Public', font=font)
        x2 = (500 - x - w2) / 2
        draw.text((x + x2, y + deltaY), 'Electronic Notary Public', (0, 0, 0), font=font)

    deltaY += 25

    if sys.argv[1] == "Virginia":
        w3, h3 = draw.textsize('Commonwealth of '+sys.argv[1], font=font)
        x3 = (500 - x - w3) / 2
        draw.text((x + x3, y + deltaY), 'Commonwealth of '+sys.argv[1], (0, 0, 0), font=font)
    else:
        w3, h3 = draw.textsize('State of '+sys.argv[1], font=font)
        x3 = (500 - x - w3) / 2
        draw.text((x + x3, y + deltaY), 'State of '+sys.argv[1], (0, 0, 0), font=font)

deltaY += 25

if sys.argv[1] == "Tennessee":
    w31, h31 = draw.textsize(sys.argv[6], font=font)
    x31 = (500 - x - w31) / 2
    draw.text((x + x31, y + deltaY), sys.argv[6], (0, 0, 0), font=font)
    deltaY += 25

if sys.argv[1] == "Idaho":
    w4, h4 = draw.textsize('Comm No. '+sys.argv[3], font=font)
    x4 = (500 - x - w4) / 2
    draw.text((x + x4, y + deltaY), 'Comm No. '+sys.argv[3], (0, 0, 0), font=font)
else:
    w4, h4 = draw.textsize('Commission #: '+sys.argv[3], font=font)
    x4 = (500 - x - w4) / 2
    draw.text((x + x4, y + deltaY), 'Commission #: '+sys.argv[3], (0, 0, 0), font=font)

deltaY += 25

if sys.argv[1] != "Idaho":
    if sys.argv[1] == "Texas":
        w5, h5 = draw.textsize('Commission Expires: '+expireDate, font=font)
        x5 = (460 - x - w5) / 2
        draw.text((x + x5, y + deltaY), 'Commission Expires: '+expireDate, (0, 0, 0), font=font)
    else:
        w5, h5 = draw.textsize('Commission Expires: '+expireDate, font=font)
        x5 = (500 - x - w5) / 2
        draw.text((x + x5, y + deltaY), 'Commission Expires: '+expireDate, (0, 0, 0), font=font)

fileExtension = "jpg"
if sys.argv[8] == "png":
    fileExtension = "png"

print("fileExtension", fileExtension)

data = img.save('public/templates/seal-'+sys.argv[7]+'.' + fileExtension)
print('public/templates/seal-'+sys.argv[7]+'.' + fileExtension)