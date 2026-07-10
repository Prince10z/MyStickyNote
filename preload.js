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
  onPinStateChanged: (callback) => ipcRenderer.on('pin-state-changed', (event, isPinned) => callback(isPinned)),
  logError: (err) => ipcRenderer.send('log-error', err),
  logMsg: (msg) => ipcRenderer.send('log-msg', msg)
});

contextBridge.exposeInMainWorld('recordingAPI', {
  getSources: () => ipcRenderer.invoke('recording:get-sources'),
  getPermissions: () => ipcRenderer.invoke('recording:get-permissions'),
  openPermissions: () => ipcRenderer.invoke('recording:open-permissions'),
  requestMicrophone: () => ipcRenderer.invoke('recording:request-microphone'),
  start: (request) => ipcRenderer.invoke('recording:start', request),
  sendAudio: (bytes) => ipcRenderer.send('recording:audio', bytes),
  pause: () => ipcRenderer.invoke('recording:pause'),
  resume: () => ipcRenderer.invoke('recording:resume'),
  stop: () => ipcRenderer.invoke('recording:stop'),
  onState: (callback) => {
    const listener = (_event, state) => callback(state);
    ipcRenderer.on('recording:state', listener);
    return () => ipcRenderer.removeListener('recording:state', listener);
  },
  onTranscript: (callback) => {
    const listener = (_event, transcript) => callback(transcript);
    ipcRenderer.on('recording:transcript', listener);
    return () => ipcRenderer.removeListener('recording:transcript', listener);
  }
});
