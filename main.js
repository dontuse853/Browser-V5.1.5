const { app, BrowserWindow, Menu } = require("electron");
const path = require("path");

// Look like regular Chrome so sites like YouTube don't treat us as an embedded app
app.userAgentFallback = app.userAgentFallback
  .replace(/\s*Electron\/\S+/, "")
  .replace(/\s*dontuse-browser\/\S+/, "");

let win;

function send(channel) {
  if (win) win.webContents.send(channel);
}

function createWindow() {
  win = new BrowserWindow({
    width: 1280,
    height: 800,
    titleBarStyle: "hiddenInset",
    backgroundColor: "#202124",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      webviewTag: true,
    },
  });
  win.loadFile("index.html");
}

// Links that try to open a new window become new tabs
app.on("web-contents-created", (_event, contents) => {
  if (contents.getType() === "webview") {
    contents.setWindowOpenHandler(({ url }) => {
      if (win) win.webContents.send("open-tab", url);
      return { action: "deny" };
    });
  }
});

function buildMenu() {
  const template = [
    { role: "appMenu" },
    {
      label: "File",
      submenu: [
        { label: "New Tab", accelerator: "CmdOrCtrl+T", click: () => send("new-tab") },
        { label: "Close Tab", accelerator: "CmdOrCtrl+W", click: () => send("close-tab") },
        { label: "Focus Address Bar", accelerator: "CmdOrCtrl+L", click: () => send("focus-url") },
      ],
    },
    { role: "editMenu" },
    {
      label: "View",
      submenu: [
        { label: "Reload", accelerator: "CmdOrCtrl+R", click: () => send("reload") },
        { role: "toggleDevTools" },
        { role: "togglefullscreen" },
      ],
    },
    { role: "windowMenu" },
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

app.whenReady().then(() => {
  buildMenu();
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => app.quit());
