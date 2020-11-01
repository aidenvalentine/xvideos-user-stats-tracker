# xvideos-user-stats-tracker
 Xvideos Web Spider to Collect Data From User Profile Page and Send It To InfluxDB Time Series Database. And automatically adds new annotations to Grafana panel when there's new videos uploaded to your Xvideos account. It's pretty slick.

# Screenshot
![Xvideos User Stats Grafana Dashboard Screenshot](https://raw.githubusercontent.com/aidenvalentine/xvideos-user-stats-tracker/main/screenshot-1.PNG)

# Requirements
1. Node.js installed on the computer running this program.
1. NPM installed.
1. Grafana Server running on an accessible URL.
1. InfluxDB running on a accessible machine.

# Installation
1. Navigate to project directory and install npm packages using ```npm install```.
2. Create new task on Windows 10 using __Task Scheduler__.
 1. General Tab - Tick __Hidden__
 1. General Tab - __Run whether user is logged in or not__
 1. Trigger - __At system startup__ - __After triggered, repeat every 5-10 minutes indefinitely.__
 1. Actions > Settings > Action - __Start a program__ - __"C:\Program Files\nodejs\node.exe"__
 1. Actions > Settings > Add arguments - __C:\Users\\%USERPROFILE%\Documents\xvideos-user-stats-tracker\index.js__
