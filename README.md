## Table of Contents

- [Intro](#intro)
- [Features](#features)
- [Installation](#installation)
- [Documents](#documents)

## Intro <a name="intro"></a>

## Future Plans <a name="plans"></a>
1. Investigate how to open source the project
2. Add a license
3. Actually create the new version
4. Donations go to nonprofit (Divided Sky Fund? Waterwheel foundation?)
5. Post on reddit, invite new developers in
6. Figure out long term next steps

## Installation & Running <a name="installation"></a>
1. Run `yarn install` (check your node version >= 16.6, recommended >= 18)
2. Run `yarn build && yarn dev`
3. Load Extension on Chrome
   1. Open - Chrome browser
   2. Access - chrome://extensions
   3. Check - Developer mode
   4. Find - Load unpacked extension
   5. Select - `dist` folder in this project (after dev or build)
4. If you want to build for production, run `yarn build` before deploying.

## Documents <a name="documents"></a>
- [Vite Plugin](https://vitejs.dev/guide/api-plugin.html)
- [ChromeExtension](https://developer.chrome.com/docs/extensions/mv3/)
- [Rollup](https://rollupjs.org/guide/en/)
- [Rollup-plugin-chrome-extension](https://www.extend-chrome.dev/rollup-plugin)
- [Streamsaver](https://github.com/jimmywarting/StreamSaver.js)
