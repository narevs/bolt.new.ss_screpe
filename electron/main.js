const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const isDev = process.env.NODE_ENV === 'development';

let mainWindow;
let adminWindow;
let loginWindow;

function createLoginWindow() {
  loginWindow = new BrowserWindow({
    width: 400,
    height: 500,
    resizable: false,
    frame: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  if (isDev) {
    loginWindow.loadURL('http://localhost:5173/login.html');
  } else {
    loginWindow.loadFile(path.join(__dirname, '../dist/login.html'));
  }

  loginWindow.on('closed', () => {
    loginWindow = null;
    if (!mainWindow) {
      app.quit();
    }
  });
}

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 700,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      webSecurity: false
    }
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function createAdminWindow() {
  adminWindow = new BrowserWindow({
    width: 800,
    height: 600,
    resizable: true,
    parent: mainWindow,
    modal: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  if (isDev) {
    adminWindow.loadURL('http://localhost:5173/admin.html');
  } else {
    adminWindow.loadFile(path.join(__dirname, '../dist/admin.html'));
  }

  adminWindow.on('closed', () => {
    adminWindow = null;
  });
}

app.whenReady().then(() => {
  createLoginWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createLoginWindow();
  }
});

// IPC handlers
ipcMain.handle('login-success', () => {
  if (loginWindow) {
    loginWindow.close();
  }
  createMainWindow();
});

ipcMain.handle('show-admin', () => {
  createAdminWindow();
});

ipcMain.handle('export-data', async (event, data, format) => {
  const { filePath } = await dialog.showSaveDialog(mainWindow, {
    defaultPath: `scholar_scraper_export_${new Date().toISOString().split('T')[0]}.${format}`,
    filters: [
      { name: format.toUpperCase(), extensions: [format] }
    ]
  });
  
  return filePath;
});

ipcMain.handle('select-directory', async () => {
  const { filePaths } = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory']
  });
  
  return filePaths[0];
});