const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('noteAPI', {
  getNoteId: () => {
    const params = new URLSearchParams(window.location.search);
    return params.get('id') || 'note-default';
  },
  getNoteConfig: (noteId) => ipcRenderer.invoke('get-note-config', noteId),
  updateNoteConfig: (noteId, data) => ipcRenderer.invoke('update-note-config', noteId, data),
  toggleAlwaysOnTop: (noteId, alwaysOnTop) => ipcRenderer.invoke('toggle-always-on-top', noteId, alwaysOnTop),
  createNewNote: () => ipcRenderer.invoke('create-new-note'),
  deleteNote: (noteId) => ipcRenderer.invoke('delete-note', noteId),
  logError: (err) => ipcRenderer.send('log-error', err),
  logMsg: (msg) => ipcRenderer.send('log-msg', msg)
});
