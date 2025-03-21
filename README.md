# Pomodoro Twitch widget (WIP)

![Pomodoro Widget](./images/image.png)

Heavily inspired by [MohFocus' timer](https://github.com/mohamed-tayeh/Minimal-Pomo-Timer) widget. 

Uses [Device Code Grant Flow](https://dev.twitch.tv/docs/authentication/getting-tokens-oauth/#device-code-grant-flow) authorization method and [ComfyJS](https://github.com/instafluff/comfyjs) library.

![JavaScript Badge](https://img.shields.io/badge/JavaScript-F7DF1E?logo=javascript&logoColor=000&style=for-the-badge)
![HTML5 Badge](https://img.shields.io/badge/HTML5-E34F26?logo=html5&logoColor=fff&style=for-the-badge)
![CSS Badge](https://img.shields.io/badge/CSS-639?logo=css&logoColor=fff&style=for-the-badge)

## Commands

- `!timer start`: Starts work timer
- `!timer 90:00`, `!timer 1:30:00` or `!timer 5400`: Set timer to 1 hour 30 minutes
- `!timer pause`: Pause timer
- `!timer resume`: Resume timer after pausing or Finished
- `!timer reset`: Resets timer back to the beginning
- `!timer skip`: Skip the current session (work/break)
- `!timer add 50`: Add 50 seconds to the timer
- `!timer sub 50`: Reduce 50 seconds from the timer
- `!timer cycle 2`: Set the current cycle to 2
- `!timer goal 9`: Set pomodoro goal number to 9
- `!timer setwork 90:00`: Set work time to be 90 minutes
- `!timer setbreak 15:00`: Set break time to be 15 minutes
- `!timer setlongbreak 20:00`: Set long break to be 20 minutes
- `!start`: Start timer before pomodoro session starts. 

## What do I use this for?

If you stream on Twitch, and want to use a pomodoro timer, use this! 

Features:
- Easily customizable
  - Appearance
    - Colours
    - Fonts
    - Shape
  - Messages
- Automatically switch scenes based on work time and break time
- Execute additional messages during work time/break time (e.g. !setgame co-working & studying)
- Send discord alert when it's break time

## Instructions

Coming soon

<!-- 1. Install the Widget
   - Option 1:
     - Click on the green Code button
     - Download Zip
     - Extract zip file
   - Option 2:
     - `git clone https://github.com/liyunze-coding/Twitch-Pomodoro-Timer.git`

2. 

3. New Browser source
  - Open OBS
  - Add a new Browser Source
  - Checked `Local File`
  - Select the `index.html` file of this project
  - You should see a pop up (modal) that ask you to authorize

4. Authorization
  - Select the browser source and Interact
  - If client ID is missing, refer to step 2-3
  - You should see activation link
  - Copy it and paste it on your browser's URL search bar (Chrome, Firefox, Opera etc.)
  - Click on `Activate`
  - Click on `Authorize`
    - Authorize using your alt account (acting as a bot) is preferred, otherwise streaming account works fine
    - Whichever account you authorize with is the account that will send chat messages
  - Interact with browser widget, click on blue button `Click here after authorizing`

5. Customize styles in `style.css` file yourself.
  - You can replace `style.css` content with `style_rectangle.css` to have a rectangular pomodoro widget -->

## Additional sound credits

- [MohFocus Timer audio](https://github.com/mohamed-tayeh/Minimal-Pomo-Timer/tree/main/media)
- [Xylophone timer audio option](https://pixabay.com/sound-effects/xylophone-a-45818/)
- [Ding audio option](https://pixabay.com/sound-effects/ding-36029/)
- [Bell audio option](https://pixabay.com/sound-effects/intro-sound-bell-269297/)

# Credits

- Developed by [RythonDev](https://twitch.tv/RythonDev)
- Based on [MohFocus' timer](https://github.com/mohamed-tayeh/Minimal-Pomo-Timer)
- ComfyJS by [Instafluff](https://github.com/instafluff/comfyjs)
- Tmi.js by [AlcaDesign](https://github.com/AlcaDesign)