// main.js (or main.ts)
const { app, BrowserWindow, dialog, ipcMain } = require('electron');
const path = require('path');

let appWindow;

function createWindow() {
  appWindow = new BrowserWindow({
    width: 1000,
    height: 800,
  });

  appWindow.loadFile(path.join(__dirname, 'dist/profing/index.html'));

  appWindow.on('closed', function () {
    appWindow = null;
  });

  // Handle IPC message from renderer process for file save dialog
  ipcMain.on('save-dialog', (event, defaultFileName) => {
    const options = {
      title: 'Save JSON File',
      defaultPath: defaultFileName,
      filters: [
        { name: 'JSON Files', extensions: ['json'] }
      ]
    };

    const filePath = dialog.showSaveDialogSync(appWindow, options);
    event.returnValue = filePath;
  });
}

app.whenReady().then(() => {
  createWindow();
});

// Quit the app when all windows are closed (except on macOS)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (appWindow === null) {
    createWindow();
  }
});
