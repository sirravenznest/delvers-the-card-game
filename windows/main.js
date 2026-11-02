const { app, BrowserWindow, Menu, shell } = require('electron');
const path = require('path');

if (!app.requestSingleInstanceLock()) app.quit();

let win;
function create() {
  Menu.setApplicationMenu(null);
  win = new BrowserWindow({
    width: 480,
    height: 880,
    minWidth: 360,
    minHeight: 600,
    backgroundColor: '#16120e',
    title: 'Delvers: The Card Game',
    autoHideMenuBar: true,
    webPreferences: { contextIsolation: true, nodeIntegration: false, sandbox: true }
  });
  win.loadFile(path.join(__dirname, 'game', 'index.html'));
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:/.test(url)) shell.openExternal(url);
    return { action: 'deny' };
  });
  win.webContents.on('before-input-event', (e, i) => {
    if (i.type === 'keyDown' && (i.key === 'F11' || (i.key === 'f' && i.control))) {
      win.setFullScreen(!win.isFullScreen());
      e.preventDefault();
    }
  });
}

app.on('second-instance', () => {
  if (win) { if (win.isMinimized()) win.restore(); win.focus(); }
});
app.whenReady().then(create);
app.on('window-all-closed', () => app.quit());
