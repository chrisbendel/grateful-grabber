import packageJson from "./package.json";

/**
 * After changing, please reload the extension at `chrome://extensions`
 */
const manifest: chrome.runtime.ManifestV3 = {
  manifest_version: 3,
  name: packageJson.name,
  version: packageJson.version,
  description: packageJson.description,
  background: {
    service_worker: "src/pages/background/index.js",
    type: "module",
  },
  action: {
    default_title: "Grateful Grabber",
    default_popup: "src/pages/popup/index.html",
    default_icon: "stealie-128.png",
  },
  icons: {
    "128": "stealie-128.png",
  },
  content_scripts: [
    {
      // matches: ["http://*/*", "https://*/*", "<all_urls>"],
      matches: ["*://*.archive.org/*", "*://archive.org/*"],
      js: ["src/pages/content/index.js"],
      // KEY for cache invalidation
      css: ["assets/css/contentStyle<KEY>.chunk.css"],
    },
  ],
  web_accessible_resources: [
    {
      resources: [
        "assets/js/*.js",
        "assets/css/*.css",
        // TODO Needed?
        // "stealie-16.png",
        // "stealie-48.png",
        "stealie-128.png",
      ],
      matches: ["*://*/*"],
    },
  ],
};

export default manifest;
