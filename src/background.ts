"use strict";
import path from "path";
import images from "images";
import { app, session, protocol, BrowserWindow } from "electron";
import { createProtocol } from "vue-cli-plugin-electron-builder/lib";
import installExtension, { VUEJS_DEVTOOLS } from "electron-devtools-installer";
const isDevelopment = process.env.NODE_ENV !== "production";

// Scheme must be registered before the app is ready
protocol.registerSchemesAsPrivileged([
  { scheme: "app", privileges: { secure: true, standard: true } }
]);

async function createWindow() {
  // Create the browser window.
  const win = new BrowserWindow({
    width: 1920,
    height: 1080,
    webPreferences: {
      webSecurity: false,
      // Use pluginOptions.nodeIntegration, leave this alone
      // See nklayman.github.io/vue-cli-plugin-electron-builder/guide/security.html#node-integration for more info
      nodeIntegration: true
    }
  });

  if (!isDevelopment) {
    win.removeMenu();
  }

  protocol.interceptFileProtocol(
    "file",
    function(req, callback) {
      const url = req.url.substr(7);
      let p: string;
      let isPreview = false;
      if (url.startsWith("/")) {
        p = decodeURI("\\" + path.normalize(url));
      } else {
        p = url;
      }
      if (p.endsWith("_preview")) {
        isPreview = true;
        p = p.substr(0, p.length - 8);
      }
      callback(p);
    },
    function(error) {
      if (error) console.error("Failed to register protocol");
    }
  );

  protocol.interceptBufferProtocol(
    "preview",
    function(req, callback) {
      const url = req.url.substr(10);
      let p: string;
      let isPreview = false;
      if (url.startsWith("/")) {
        p = decodeURI("\\" + path.normalize(url));
      } else {
        p = url;
      }
      if (p.endsWith("_preview")) {
        isPreview = true;
        p = p.substr(0, p.length - 8);
      }
      const type = /\.(png|jpg)$/.exec(p);
      const v = (type && type[1]) || "png";
      const img = images.loadFromFile(p);
      if (isPreview) {
        img.resize(500);
      }
      const buf = img.encode(v as images.FILE_TYPE);
      callback(buf);
    },
    function(error) {
      if (error) console.error("Failed to register protocol");
    }
  );

  if (process.env.WEBPACK_DEV_SERVER_URL) {
    // Load the url of the dev server if in development mode
    await win.loadURL(process.env.WEBPACK_DEV_SERVER_URL as string);
    if (!process.env.IS_TEST) win.webContents.openDevTools();
  } else {
    createProtocol("app");
    // Load the index.html when not in development
    win.loadURL("app://./index.html");
  }
}

// Quit when all windows are closed.
app.on("window-all-closed", () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on("ready", async () => {
  if (isDevelopment && !process.env.IS_TEST) {
    // Install Vue Devtools
    try {
      await installExtension(VUEJS_DEVTOOLS);
    } catch (e) {
      console.error("Vue Devtools failed to install:", e.toString());
    }
  }
  createWindow();
});

// Exit cleanly on request from parent process in development mode.
if (isDevelopment) {
  if (process.platform === "win32") {
    process.on("message", data => {
      if (data === "graceful-exit") {
        app.quit();
      }
    });
  } else {
    process.on("SIGTERM", () => {
      app.quit();
    });
  }
}
