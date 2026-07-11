const { app, BrowserWindow, ipcMain, screen, globalShortcut, dialog, Notification } = require('electron');
const { autoUpdater } = require('electron-updater');
const path = require('path');
const fs = require('fs');
const { registerRecordingFeature } = require('./dist-electron/recording.js');
const { lockNote, unlockNote } = require('./src/main/crypto-notes.js');
const { sendTasksToNotion, sendTasksToLinear } = require('./src/main/integrations.js');
const { registerSyncFeature } = require('./src/main/sync.js');

// Load environment variables from .env if it exists
function loadEnv() {
  const envPath = path.join(__dirname, '.env');
  if (fs.existsSync(envPath)) {
    try {
      const content = fs.readFileSync(envPath, 'utf8');
      content.split(/\r?\n/).forEach(line => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
          const parts = trimmed.split('=');
          if (parts.length >= 2) {
            const key = parts[0].trim();
            const value = parts.slice(1).join('=').trim().replace(/^['"]|['"]$/g, '');
            process.env[key] = value;
          }
        }
      });
      console.log('[MAIN LOG] Successfully loaded env variables from .env');
    } catch (err) {
      console.error('[MAIN ERROR] Failed to load .env file:', err);
    }
  }
}
loadEnv();

// Configure auto-updater
autoUpdater.autoDownload = true;

autoUpdater.on('checking-for-update', () => {
  console.log('[UPDATER LOG] Checking for updates...');
});

autoUpdater.on('update-available', (info) => {
  console.log(`[UPDATER LOG] Update available: Version ${info.version}`);
});

autoUpdater.on('update-not-available', (info) => {
  console.log('[UPDATER LOG] Update not available.');
});

autoUpdater.on('error', (err) => {
  console.error('[UPDATER ERROR] Error in auto-updater:', err);
});

autoUpdater.on('download-progress', (progressObj) => {
  console.log(`[UPDATER LOG] Downloading update: ${Math.round(progressObj.percent)}%`);
});

autoUpdater.on('update-downloaded', (info) => {
  console.log('[UPDATER LOG] Update downloaded. Will install on restart.');
  autoUpdater.quitAndInstall();
});

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

  // Ensure global config exists
  if (!notesConfig.global) {
    notesConfig.global = {
      activeProvider: 'gemini',
      providers: {
        gemini: { apiKey: '', model: 'gemini-2.5-flash' },
        openai: { apiKey: '', model: 'gpt-4o-mini' },
        deepseek: { apiKey: '', model: 'deepseek-chat' }
      }
    };
  }

  if (!notesConfig.global.trash) {
    notesConfig.global.trash = [];
  }

  // Ensure analyticsClientId exists
  if (!notesConfig.global.analyticsClientId) {
    const crypto = require('crypto');
    notesConfig.global.analyticsClientId = crypto.randomUUID();
    saveConfig();
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

function updateDockVisibility() {
  if (process.platform !== 'darwin') return;
  const hasPinnedNotes = notesConfig.notes.some(n => n.alwaysOnTop);
  try {
    if (hasPinnedNotes) {
      app.dock.hide();
      console.log('[MAIN LOG] Dock hidden (pinned notes exist)');
    } else {
      app.dock.show();
      console.log('[MAIN LOG] Dock shown (no pinned notes)');
    }
  } catch (err) {
    console.error('[MAIN ERROR] Failed to update dock visibility:', err);
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
    visualStyle: 'paper',
    noteText: '',
    tab: 'note',
    timeSubtab: 'timer',
    timerDuration: 0,
    alarmTime: null,
    stopwatchState: null,
    opacity: 100,
    autoDim: false,
    dimOpacity: 45,
    tags: [],
    locked: false,
    lockSalt: null,
    lockIv: null,
    lockAuthTag: null,
    lockCiphertext: null,
    remindAt: null,
    updatedAt: Date.now()
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
    height: config.collapsed ? 44 : (config.height || 420),
    x: config.x !== null ? config.x : Math.round((devWidth - 320) / 2),
    y: config.y !== null ? config.y : Math.round((devHeight - 420) / 2),
    minWidth: 320,
    minHeight: 44,
    frame: false,
    transparent: true,
    hasShadow: true,
    alwaysOnTop: config.alwaysOnTop || false,
    resizable: !config.collapsed,
    icon: path.join(__dirname, 'assets', 'icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      devTools: !app.isPackaged
    }
  });

  win.setFullScreenable(false);

  console.log(`[MAIN LOG] Creating window for ${noteId}. Saved alwaysOnTop state: ${config.alwaysOnTop}`);
  // Keep on top of fullscreen apps & virtual desktops (Spaces) on macOS
  if (config.alwaysOnTop) {
    try {
      win.setAlwaysOnTop(true, 'status', 1);
      win.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true, skipTransformProcessType: true });
      console.log(`[MAIN LOG] Window ${noteId} set to alwaysOnTop on startup`);
    } catch (err) {
      console.error(`[MAIN ERROR] Failed to set alwaysOnTop on startup:`, err);
    }
  } else {
    try {
      win.setAlwaysOnTop(false);
      win.setVisibleOnAllWorkspaces(false, { skipTransformProcessType: true });
      console.log(`[MAIN LOG] Window ${noteId} set to normal level on startup`);
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
    if (!config.collapsed) {
      config.width = bounds.width;
      config.height = bounds.height;
    }
    saveConfig();
  };

  win.on('move', saveBounds);
  win.on('resize', saveBounds);
  win.on('close', () => {
    windows.delete(noteId);
  });

  const remoteUrl = process.env.APP_REMOTE_URL;
  if (remoteUrl) {
    console.log(`[MAIN LOG] Loading remote URL for note ${noteId}: ${remoteUrl}`);
    win.loadURL(`${remoteUrl}?id=${noteId}`, {
      extraHeaders: 'pragma: no-cache\r\ncache-control: no-cache\r\n'
    });
  } else {
    win.loadFile(path.join(__dirname, 'renderer', 'index.html'), { query: { id: noteId } });
  }
  windows.set(noteId, win);
}

// IPC Handlers
ipcMain.handle('track-event', async (event, eventName, params = {}) => {
  const measurementId = process.env.GA_MEASUREMENT_ID;
  const apiSecret = process.env.GA_API_SECRET;
  
  if (!measurementId || !apiSecret) {
    return;
  }

  const clientId = notesConfig.global?.analyticsClientId || 'default-client-id';
  const url = `https://www.google-analytics.com/mp/collect?api_secret=${apiSecret}&measurement_id=${measurementId}`;
  
  const payload = {
    client_id: clientId,
    events: [{
      name: eventName,
      params: {
        ...params,
        engagement_time_msec: '100',
        session_id: clientId,
        os_name: process.platform,
        os_arch: process.arch,
      }
    }]
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    
    if (!response.ok) {
      console.error(`[MAIN ERROR] GA Measurement Protocol request failed with status: ${response.status}`);
    }
  } catch (err) {
    console.error('[MAIN ERROR] Failed to send GA event:', err);
  }
});

ipcMain.handle('get-note-config', (event, noteId) => {
  const config = notesConfig.notes.find(n => n.id === noteId);
  return config || createDefaultNoteConfig(noteId);
});

ipcMain.handle('update-note-config', (event, noteId, data) => {
  const index = notesConfig.notes.findIndex(n => n.id === noteId);
  if (index !== -1) {
    notesConfig.notes[index] = { ...notesConfig.notes[index], ...data, updatedAt: Date.now() };
    saveConfig();
  }
});

ipcMain.handle('list-all-notes', (event, { query, tag } = {}) => {
  const needle = (query || '').trim().toLowerCase();
  const allTagsSet = new Set();
  notesConfig.notes.forEach(n => (n.tags || []).forEach(t => allTagsSet.add(t)));

  const notes = notesConfig.notes
    .filter(n => {
      if (tag && !(n.tags || []).includes(tag)) return false;
      if (!needle) return true;
      const haystack = `${n.noteText || ''} ${(n.tags || []).join(' ')}`.toLowerCase();
      return haystack.includes(needle);
    })
    .map(n => ({
      id: n.id,
      noteText: n.locked ? '' : (n.noteText || ''),
      tags: n.tags || [],
      color: n.color,
      locked: !!n.locked,
      updatedAt: n.updatedAt || 0
    }))
    .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));

  return { notes, allTags: Array.from(allTagsSet).sort() };
});

ipcMain.handle('open-note', (event, noteId) => {
  createNoteWindow(noteId);
});

function escapeHtmlForExport(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

ipcMain.handle('export-note', async (event, noteId, format, text) => {
  try {
    const win = BrowserWindow.fromWebContents(event.sender);
    const defaultName = `sticky-note-${noteId}.${format === 'pdf' ? 'pdf' : format}`;
    const filters = format === 'pdf'
      ? [{ name: 'PDF', extensions: ['pdf'] }]
      : format === 'md'
        ? [{ name: 'Markdown', extensions: ['md'] }]
        : [{ name: 'Text', extensions: ['txt'] }];

    const { canceled, filePath } = await dialog.showSaveDialog(win, { defaultPath: defaultName, filters });
    if (canceled || !filePath) return { error: 'canceled' };

    if (format === 'pdf') {
      const printWindow = new BrowserWindow({ show: false, webPreferences: { offscreen: true } });
      const html = `<html><body style="font-family: -apple-system, Helvetica, Arial, sans-serif; white-space: pre-wrap; padding: 48px; font-size: 13px; line-height: 1.6; color: #1a1a1a;">${escapeHtmlForExport(text).replace(/\n/g, '<br>')}</body></html>`;
      try {
        await printWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);
        const pdfBuffer = await printWindow.webContents.printToPDF({});
        fs.writeFileSync(filePath, pdfBuffer);
      } finally {
        printWindow.close();
      }
    } else {
      fs.writeFileSync(filePath, text || '', 'utf8');
    }
    return { ok: true, filePath };
  } catch (err) {
    console.error('[MAIN ERROR] Export failed:', err);
    return { error: err.message };
  }
});

ipcMain.handle('lock-note', (event, noteId, passphrase, plaintext) => {
  const index = notesConfig.notes.findIndex(n => n.id === noteId);
  if (index === -1) return { error: 'Note not found' };
  try {
    const fields = lockNote(passphrase, plaintext);
    notesConfig.notes[index] = { ...notesConfig.notes[index], ...fields, updatedAt: Date.now() };
    saveConfig();
    return { locked: true, lockSalt: fields.lockSalt, lockIv: fields.lockIv, lockAuthTag: fields.lockAuthTag, lockCiphertext: fields.lockCiphertext };
  } catch (err) {
    return { error: err.message };
  }
});

ipcMain.handle('unlock-note', (event, noteId, passphrase) => {
  const config = notesConfig.notes.find(n => n.id === noteId);
  if (!config) return { error: 'Note not found' };
  try {
    const plaintext = unlockNote(config, passphrase);
    return { noteText: plaintext };
  } catch (err) {
    return { error: err.message };
  }
});

ipcMain.handle('send-tasks-to-notion', async (event, payload) => {
  try {
    return await sendTasksToNotion(payload);
  } catch (err) {
    return { error: err.message };
  }
});

ipcMain.handle('send-tasks-to-linear', async (event, payload) => {
  try {
    return await sendTasksToLinear(payload);
  } catch (err) {
    return { error: err.message };
  }
});

/* ==========================================================================
   Note reminders (native OS notifications)
   ========================================================================== */
ipcMain.handle('set-reminder', (event, noteId, timestamp, preview) => {
  const config = notesConfig.notes.find(n => n.id === noteId);
  if (!config) return { error: 'Note not found' };
  config.remindAt = timestamp || null;
  config.remindPreview = preview || '';
  config.updatedAt = Date.now();
  saveConfig();
  return { ok: true };
});

function checkDueReminders() {
  const now = Date.now();
  let changed = false;
  notesConfig.notes.forEach(note => {
    if (note.remindAt && note.remindAt <= now) {
      changed = true;
      const preview = (note.remindPreview || '').trim();
      if (Notification.isSupported()) {
        const notification = new Notification({
          title: 'MyStickyNote reminder',
          body: preview || 'Time to check your sticky note.'
        });
        notification.on('click', () => createNoteWindow(note.id));
        notification.show();
      }
      note.remindAt = null;
      const win = windows.get(note.id);
      if (win && !win.isDestroyed()) {
        win.webContents.send('reminder-fired');
      }
    }
  });
  if (changed) saveConfig();
}

ipcMain.handle('get-global-config', () => {
  return notesConfig.global || {
    activeProvider: 'gemini',
    providers: {
      gemini: { apiKey: '', model: 'gemini-2.5-flash' },
      openai: { apiKey: '', model: 'gpt-4o-mini' },
      deepseek: { apiKey: '', model: 'deepseek-chat' }
    }
  };
});

ipcMain.handle('update-global-config', (event, data) => {
  notesConfig.global = { ...notesConfig.global, ...data };
  saveConfig();
});

ipcMain.handle('toggle-always-on-top', (event, noteId, alwaysOnTop) => {
  console.log(`[MAIN LOG] toggle-always-on-top called for ${noteId} with value: ${alwaysOnTop}`);
  
  // 1. Update config first so that updateDockVisibility behaves correctly
  const config = notesConfig.notes.find(n => n.id === noteId);
  if (config) {
    config.alwaysOnTop = alwaysOnTop;
    saveConfig();
  }
  
  // 2. Update dock visibility before changing window levels
  updateDockVisibility();

  // 3. Update window always-on-top state
  const win = windows.get(noteId);
  if (win) {
    try {
      if (alwaysOnTop) {
        win.setAlwaysOnTop(true, 'status', 1);
        win.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true, skipTransformProcessType: true });
        console.log(`[MAIN LOG] Window ${noteId} alwaysOnTop set to true (status level)`);
      } else {
        win.setAlwaysOnTop(false);
        win.setVisibleOnAllWorkspaces(false, { skipTransformProcessType: true });
        console.log(`[MAIN LOG] Window ${noteId} alwaysOnTop set to false (normal level)`);
      }
    } catch (err) {
      console.error(`[MAIN ERROR] Failed to set always-on-top:`, err);
    }
  }
});

ipcMain.handle('toggle-collapse-window', (event, noteId) => {
  const win = windows.get(noteId);
  const config = notesConfig.notes.find(n => n.id === noteId);
  if (win && config) {
    config.collapsed = !config.collapsed;
    
    if (config.collapsed) {
      config.expandedHeight = win.getBounds().height;
      win.setResizable(false);
      win.setSize(config.width || 320, 44, true); // smooth animate on macOS
    } else {
      win.setSize(config.width || 320, config.expandedHeight || 420, true); // smooth animate on macOS
      setTimeout(() => {
        if (win && !win.isDestroyed()) {
          win.setResizable(true);
        }
      }, 300); // Wait for animation to finish before enabling resize
    }
    saveConfig();
    return config.collapsed;
  }
  return false;
});

ipcMain.handle('temp-expand-window', (event, noteId) => {
  const win = windows.get(noteId);
  const config = notesConfig.notes.find(n => n.id === noteId);
  if (win && config && config.collapsed) {
    win.setSize(config.width || 320, config.expandedHeight || 420, true); // smooth animate on macOS
  }
});

ipcMain.handle('temp-collapse-window', (event, noteId) => {
  const win = windows.get(noteId);
  const config = notesConfig.notes.find(n => n.id === noteId);
  if (win && config && config.collapsed) {
    win.setSize(config.width || 320, 44, true); // smooth animate on macOS
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
  updateDockVisibility();
  createNoteWindow(newId);
  return newId;
});

ipcMain.handle('delete-note', (event, noteId) => {
  const win = windows.get(noteId);
  if (win) {
    win.close();
  }

  // Save note to trash before deleting (only if it has text content)
  const noteToDelete = notesConfig.notes.find(n => n.id === noteId);
  if (noteToDelete) {
    const hasText = noteToDelete.noteText && noteToDelete.noteText.trim().length > 0;
    if (hasText) {
      if (!notesConfig.global) {
        notesConfig.global = {};
      }
      if (!notesConfig.global.trash) {
        notesConfig.global.trash = [];
      }
      
      // Add deleted timestamp
      const trashItem = {
        ...noteToDelete,
        deletedAt: Date.now()
      };
      
      // Prepend to trash list
      notesConfig.global.trash.unshift(trashItem);
      
      // Cap trash at 20 items
      if (notesConfig.global.trash.length > 20) {
        notesConfig.global.trash.pop();
      }
    }
  }

  notesConfig.notes = notesConfig.notes.filter(n => n.id !== noteId);
  saveConfig();
  updateDockVisibility();

  // If no windows left, quit
  if (notesConfig.notes.length === 0) {
    app.quit();
  }
});

ipcMain.handle('restore-note', (event, noteId) => {
  if (notesConfig.global && notesConfig.global.trash) {
    const index = notesConfig.global.trash.findIndex(n => n.id === noteId);
    if (index !== -1) {
      const restored = notesConfig.global.trash[index];
      delete restored.deletedAt;
      
      // Ensure the note isn't already active
      if (!notesConfig.notes.some(n => n.id === noteId)) {
        notesConfig.notes.push(restored);
      }
      
      // Remove from trash
      notesConfig.global.trash.splice(index, 1);
      
      saveConfig();
      updateDockVisibility();
      createNoteWindow(noteId);
      return true;
    }
  }
  return false;
});

// App Lifecycle
app.whenReady().then(() => {
  loadConfig();
  updateDockVisibility();

  registerRecordingFeature({
    getGlobalConfig: () => notesConfig.global || {},
    isTrustedSender: (senderUrl) => {
      try {
        if (senderUrl.startsWith('file://')) return true;
        const configuredRemote = process.env.APP_REMOTE_URL;
        return Boolean(configuredRemote) && new URL(senderUrl).origin === new URL(configuredRemote).origin;
      } catch {
        return false;
      }
    }
  });

  registerSyncFeature({
    ipcMain,
    getNotesConfig: () => notesConfig,
    saveConfig,
    getWindow: (noteId) => windows.get(noteId)
  });

  // Check for due note reminders on launch, then every 30 seconds.
  checkDueReminders();
  setInterval(checkDueReminders, 30000);

  // Check for updates automatically on startup
  try {
    autoUpdater.checkForUpdatesAndNotify();
  } catch (err) {
    console.error('[UPDATER ERROR] Failed to check for updates:', err);
  }
  
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

  // Register global keyboard shortcuts
  try {
    // Cmd+N / Ctrl+N: Create new note
    globalShortcut.register(process.platform === 'darwin' ? 'Command+N' : 'Control+N', () => {
      const newId = `note-${Date.now()}`;
      const newConfig = createDefaultNoteConfig(newId);
      const focusedWin = BrowserWindow.getFocusedWindow();
      if (focusedWin) {
        const bounds = focusedWin.getBounds();
        newConfig.x = bounds.x + 30;
        newConfig.y = bounds.y + 30;
      }
      notesConfig.notes.push(newConfig);
      saveConfig();
      updateDockVisibility();
      createNoteWindow(newId);
      console.log('[SHORTCUT] Created new note via keyboard shortcut');
    });

    // Cmd+W / Ctrl+W: Close focused note
    globalShortcut.register(process.platform === 'darwin' ? 'Command+W' : 'Control+W', () => {
      const focusedWin = BrowserWindow.getFocusedWindow();
      if (focusedWin) {
        // Find the noteId for this window
        for (const [noteId, win] of windows.entries()) {
          if (win === focusedWin) {
            win.close();
            notesConfig.notes = notesConfig.notes.filter(n => n.id !== noteId);
            saveConfig();
            updateDockVisibility();
            if (notesConfig.notes.length === 0) {
              app.quit();
            }
            console.log(`[SHORTCUT] Closed note ${noteId} via keyboard shortcut`);
            break;
          }
        }
      }
    });

    // Cmd+Shift+P / Ctrl+Shift+P: Toggle pin on focused note
    globalShortcut.register(process.platform === 'darwin' ? 'Command+Shift+P' : 'Control+Shift+P', () => {
      const focusedWin = BrowserWindow.getFocusedWindow();
      if (focusedWin) {
        for (const [noteId, win] of windows.entries()) {
          if (win === focusedWin) {
            const config = notesConfig.notes.find(n => n.id === noteId);
            if (config) {
              config.alwaysOnTop = !config.alwaysOnTop;
              saveConfig();
              updateDockVisibility();
              if (config.alwaysOnTop) {
                win.setAlwaysOnTop(true, 'status', 1);
                win.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true, skipTransformProcessType: true });
              } else {
                win.setAlwaysOnTop(false);
                win.setVisibleOnAllWorkspaces(false, { skipTransformProcessType: true });
              }
              // Notify renderer to update UI
              win.webContents.send('pin-state-changed', config.alwaysOnTop);
              console.log(`[SHORTCUT] Toggled pin for ${noteId} to ${config.alwaysOnTop}`);
            }
            break;
          }
        }
      }
    });

    console.log('[MAIN LOG] Global keyboard shortcuts registered');
  } catch (err) {
    console.error('[MAIN ERROR] Failed to register keyboard shortcuts:', err);
  }

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
  globalShortcut.unregisterAll();
  app.quit();
});

// Diagnosing Renderer Logs via Terminal
ipcMain.on('log-error', (event, err) => {
  console.error('\x1b[31m[RENDERER ERROR]:\x1b[0m', err);
});
ipcMain.on('log-msg', (event, msg) => {
  console.log('\x1b[36m[RENDERER LOG]:\x1b[0m', msg);
});
