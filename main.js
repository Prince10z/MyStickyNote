const { app, BrowserWindow, ipcMain, screen } = require('electron');
const path = require('path');
const fs = require('fs');

const CONFIG_PATH = path.join(app.getPath('userData'), 'sticky-notes.json');

// Memory storage for notes config
let notesConfig = { notes: [] };
// Map of noteId -> BrowserWindow
const windows = new Map();

// Load config from disk
function loadConfig() {
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      const data = fs.readFileSync(CONFIG_PATH, 'utf8');
      notesConfig = JSON.parse(data);
    } else {
      notesConfig = { notes: [] };
    }
  } catch (error) {
    console.error('Failed to load notes config:', error);
    notesConfig = { notes: [] };
  }

  // Create default note if list is empty
  if (!notesConfig.notes || notesConfig.notes.length === 0) {
    notesConfig.notes = [createDefaultNoteConfig('note-default')];
    saveConfig();
  }
}

// Save config to disk
function saveConfig() {
  try {
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(notesConfig, null, 2), 'utf8');
  } catch (error) {
    console.error('Failed to save notes config:', error);
  }
}

function createDefaultNoteConfig(id) {
  return {
    id: id || `note-${Date.now()}`,
    x: null,
    y: null,
    width: 320,
    height: 420,
    alwaysOnTop: false,
    color: 'yellow',
    noteText: '',
    tab: 'note',
    timerDuration: 0,
    alarmTime: null,
    stopwatchState: null,
    opacity: 100,
    autoDim: false,
    dimOpacity: 45
  };
}

function createNoteWindow(noteId) {
  if (windows.has(noteId)) {
    windows.get(noteId).focus();
    return;
  }

  let config = notesConfig.notes.find(n => n.id === noteId);
  if (!config) {
    config = createDefaultNoteConfig(noteId);
    notesConfig.notes.push(config);
    saveConfig();
  }

  const primaryDisplay = screen.getPrimaryDisplay();
  const { width: devWidth, height: devHeight } = primaryDisplay.workAreaSize;

  const win = new BrowserWindow({
    width: config.width || 320,
    height: config.height || 420,
    x: config.x !== null ? config.x : Math.round((devWidth - 320) / 2),
    y: config.y !== null ? config.y : Math.round((devHeight - 420) / 2),
    frame: false,
    type: 'panel',
    transparent: true,
    hasShadow: true,
    alwaysOnTop: config.alwaysOnTop || false,
    icon: path.join(__dirname, 'assets', 'icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  win.setFullScreenable(false);

  console.log(`[MAIN LOG] Creating window for ${noteId}. Saved alwaysOnTop state: ${config.alwaysOnTop}`);
  // Keep on top of fullscreen apps & virtual desktops (Spaces) on macOS
  if (config.alwaysOnTop) {
    try {
      win.setAlwaysOnTop(true, 'status', 1);
      win.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
      console.log(`[MAIN LOG] Window ${noteId} set to alwaysOnTop on startup`);
    } catch (err) {
      console.error(`[MAIN ERROR] Failed to set alwaysOnTop on startup:`, err);
    }
  } else {
    try {
      win.setAlwaysOnTop(false, 'normal', 0);
    } catch (err) {
      console.error(`[MAIN ERROR] Failed to demote window level on startup:`, err);
    }
  }

  // Keep window state updated on move or resize
  const saveBounds = () => {
    if (win.isDestroyed()) return;
    const bounds = win.getBounds();
    config.x = bounds.x;
    config.y = bounds.y;
    config.width = bounds.width;
    config.height = bounds.height;
    saveConfig();
  };

  win.on('move', saveBounds);
  win.on('resize', saveBounds);
  win.on('close', () => {
    windows.delete(noteId);
  });

  win.loadFile(path.join(__dirname, 'renderer', 'index.html'), { query: { id: noteId } });
  windows.set(noteId, win);
}

// IPC Handlers
ipcMain.handle('get-note-config', (event, noteId) => {
  const config = notesConfig.notes.find(n => n.id === noteId);
  return config || createDefaultNoteConfig(noteId);
});

ipcMain.handle('update-note-config', (event, noteId, data) => {
  const index = notesConfig.notes.findIndex(n => n.id === noteId);
  if (index !== -1) {
    notesConfig.notes[index] = { ...notesConfig.notes[index], ...data };
    saveConfig();
  }
});

ipcMain.handle('toggle-always-on-top', (event, noteId, alwaysOnTop) => {
  console.log(`[MAIN LOG] toggle-always-on-top called for ${noteId} with value: ${alwaysOnTop}`);
  const win = windows.get(noteId);
  if (win) {
    try {
      if (alwaysOnTop) {
        win.setAlwaysOnTop(true, 'status', 1);
        win.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
        console.log(`[MAIN LOG] Window ${noteId} alwaysOnTop set to true (status level)`);
      } else {
        win.setAlwaysOnTop(false, 'normal', 0);
        win.setVisibleOnAllWorkspaces(false);
        console.log(`[MAIN LOG] Window ${noteId} alwaysOnTop set to false (normal level)`);
      }
    } catch (err) {
      console.error(`[MAIN ERROR] Failed to set always-on-top:`, err);
    }
    const config = notesConfig.notes.find(n => n.id === noteId);
    if (config) {
      config.alwaysOnTop = alwaysOnTop;
      saveConfig();
    }
  }
});

ipcMain.handle('create-new-note', () => {
  const newId = `note-${Date.now()}`;
  const newConfig = createDefaultNoteConfig(newId);
  
  // Position the new note slightly offset from the focused note
  const focusedWin = BrowserWindow.getFocusedWindow();
  if (focusedWin) {
    const bounds = focusedWin.getBounds();
    newConfig.x = bounds.x + 30;
    newConfig.y = bounds.y + 30;
    newConfig.color = notesConfig.notes.find(n => n.id === Array.from(windows.keys()).find(k => windows.get(k) === focusedWin))?.color || 'yellow';
  } else {
    // Center it on screen with slight variation
    const primaryDisplay = screen.getPrimaryDisplay();
    const { width: devWidth, height: devHeight } = primaryDisplay.workAreaSize;
    newConfig.x = Math.round((devWidth - 320) / 2) + Math.round((Math.random() - 0.5) * 100);
    newConfig.y = Math.round((devHeight - 420) / 2) + Math.round((Math.random() - 0.5) * 100);
  }

  notesConfig.notes.push(newConfig);
  saveConfig();
  createNoteWindow(newId);
  return newId;
});

ipcMain.handle('delete-note', (event, noteId) => {
  const win = windows.get(noteId);
  if (win) {
    win.close();
  }
  notesConfig.notes = notesConfig.notes.filter(n => n.id !== noteId);
  saveConfig();

  // If no windows left, quit
  if (notesConfig.notes.length === 0) {
    app.quit();
  }
});

// App Lifecycle
app.whenReady().then(() => {
  loadConfig();
  
  if (process.platform === 'darwin') {
    try {
      app.dock.setIcon(path.join(__dirname, 'assets', 'icon.png'));
    } catch (err) {
      console.error('Failed to set macOS dock icon:', err);
    }
  }

  // Create windows for all stored notes
  notesConfig.notes.forEach(note => {
    createNoteWindow(note.id);
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      loadConfig();
      notesConfig.notes.forEach(note => {
        createNoteWindow(note.id);
      });
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Diagnosing Renderer Logs via Terminal
ipcMain.on('log-error', (event, err) => {
  console.error('\x1b[31m[RENDERER ERROR]:\x1b[0m', err);
});
ipcMain.on('log-msg', (event, msg) => {
  console.log('\x1b[36m[RENDERER LOG]:\x1b[0m', msg);
});

