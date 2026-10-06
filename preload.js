const { contextBridge, ipcRenderer } = require("electron");

const allowed = ["open-tab", "new-tab", "close-tab", "focus-url", "reload"];

contextBridge.exposeInMainWorld("api", {
  on: (channel, callback) => {
    if (allowed.includes(channel)) {
      ipcRenderer.on(channel, (_event, ...args) => callback(...args));
    }
  },
});
