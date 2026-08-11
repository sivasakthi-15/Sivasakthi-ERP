const { app, BrowserWindow, dialog } = require("electron");
const path = require("path");

process.on("uncaughtException", (err) => {
  dialog.showErrorBox("Electron Error", err.stack || err.toString());
});

process.on("unhandledRejection", (err) => {
  dialog.showErrorBox("Electron Promise Error", String(err));
});

function createWindow() {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 700,
    autoHideMenuBar: true,
    title: "SIVASAKTHI ERP",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  if (app.isPackaged) {
    win.loadFile(path.join(process.resourcesPath, "app.asar", "dist", "index.html"));
  } else {
    win.loadURL("http://localhost:3000");
    win.webContents.openDevTools();
  }
}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});