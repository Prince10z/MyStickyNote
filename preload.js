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
  logMsg: (msg) => ipcRenderer.send('log-msg', msg),

  // Notes Library (cross-note search + tags)
  listAllNotes: (options) => ipcRenderer.invoke('list-all-notes', options),
  openNote: (noteId) => ipcRenderer.invoke('open-note', noteId),

  // Export
  exportNote: (noteId, format, text) => ipcRenderer.invoke('export-note', noteId, format, text),

  // Reminders
  setReminder: (noteId, timestamp, preview) => ipcRenderer.invoke('set-reminder', noteId, timestamp, preview),
  onReminderFired: (callback) => ipcRenderer.on('reminder-fired', () => callback()),

  // Per-note passphrase lock
  lockNote: (noteId, passphrase, plaintext) => ipcRenderer.invoke('lock-note', noteId, passphrase, plaintext),
  unlockNote: (noteId, passphrase) => ipcRenderer.invoke('unlock-note', noteId, passphrase),

  // Integrations (BYOK: user's own Notion/Linear tokens)
  sendTasksToNotion: (payload) => ipcRenderer.invoke('send-tasks-to-notion', payload),
  sendTasksToLinear: (payload) => ipcRenderer.invoke('send-tasks-to-linear', payload),

  // Account & cloud sync (optional, Supabase-backed)
  accountSignUp: (email, password) => ipcRenderer.invoke('account:sign-up', email, password),
  accountSignIn: (email, password) => ipcRenderer.invoke('account:sign-in', email, password),
  accountSignOut: () => ipcRenderer.invoke('account:sign-out'),
  getAccountSession: () => ipcRenderer.invoke('account:get-session'),
  accountSyncNow: () => ipcRenderer.invoke('account:sync-now'),
  onNoteUpdatedExternally: (callback) => ipcRenderer.on('note-updated-externally', (event, payload) => callback(payload))
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
