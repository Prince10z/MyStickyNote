const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('noteAPI', {
  getNoteId: () => {
    const params = new URLSearchParams(window.location.search);
    return params.get('id') || 'note-default';
  },
  getNoteConfig: (noteId) => ipcRenderer.invoke('get-note-config', noteId),
  updateNoteConfig: (noteId, data) => ipcRenderer.invoke('update-note-config', noteId, data),
  getGlobalConfig: () => ipcRenderer.invoke('get-global-config'),
  updateGlobalConfig: (data) => ipcRenderer.invoke('update-global-config', data),
  toggleAlwaysOnTop: (noteId, alwaysOnTop) => ipcRenderer.invoke('toggle-always-on-top', noteId, alwaysOnTop),
  toggleCollapseWindow: (noteId) => ipcRenderer.invoke('toggle-collapse-window', noteId),
  tempExpandWindow: (noteId) => ipcRenderer.invoke('temp-expand-window', noteId),
  tempCollapseWindow: (noteId) => ipcRenderer.invoke('temp-collapse-window', noteId),
  createNewNote: () => ipcRenderer.invoke('create-new-note'),
  deleteNote: (noteId) => ipcRenderer.invoke('delete-note', noteId),
  restoreNote: (noteId) => ipcRenderer.invoke('restore-note', noteId),
  trackEvent: (eventName, params) => ipcRenderer.invoke('track-event', eventName, params),
  logError: (err) => ipcRenderer.send('log-error', err),
  logMsg: (msg) => ipcRenderer.send('log-msg', msg)
});
