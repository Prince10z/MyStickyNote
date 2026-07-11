// Pipe renderer errors to the main terminal console
window.onerror = function (message, source, lineno, colno, error) {
  if (window.noteAPI && window.noteAPI.logError) {
    window.noteAPI.logError(`${message} at ${source}:${lineno}:${colno}`);
  }
  return false;
};
window.addEventListener('unhandledrejection', function (event) {
  if (window.noteAPI && window.noteAPI.logError) {
    window.noteAPI.logError(`Unhandled Promise Rejection: ${event.reason}`);
  }
});

// Get elements
const noteEditor = document.getElementById('note-editor');
const btnNew = document.getElementById('btn-new');
const btnColor = document.getElementById('btn-color');
const colorPalette = document.getElementById('color-palette');
const themePreviewCard = document.getElementById('theme-preview-card');
const themePreviewLabel = document.getElementById('theme-preview-label');
const colorDots = document.querySelectorAll('.color-dot');
const styleOptions = document.querySelectorAll('.style-option');
const presetOptions = document.querySelectorAll('.preset-option');
const btnPin = document.getElementById('btn-pin');
const btnCollapse = document.getElementById('btn-collapse');
const btnDelete = document.getElementById('btn-delete');
const navItems = document.querySelectorAll('.nav-item');
const panels = document.querySelectorAll('.panel');

// Timer elements
const timerLabel = document.getElementById('timer-label');
const timerMinInput = document.getElementById('timer-min');
const timerSecInput = document.getElementById('timer-sec');
const timerInputs = document.getElementById('timer-inputs');
const timerBtnStart = document.getElementById('timer-btn-start');
const timerBtnPause = document.getElementById('timer-btn-pause');
const timerBtnReset = document.getElementById('timer-btn-reset');
const progressCircle = document.querySelector('.progress-ring__circle');

// Alarm elements
const alarmClock = document.getElementById('alarm-live-clock');
const alarmHourTrigger = document.getElementById('btn-hour-trigger');
const alarmHourMenu = document.getElementById('menu-hour');
const alarmMinuteTrigger = document.getElementById('btn-minute-trigger');
const alarmMinuteMenu = document.getElementById('menu-minute');
const alarmAmpmToggle = document.getElementById('btn-ampm-toggle');
const alarmBtnSet = document.getElementById('alarm-btn-set');
const alarmStatusCard = document.getElementById('alarm-status-card');
const activeAlarmTime = document.getElementById('active-alarm-time');
const activeAlarmCountdown = document.getElementById('active-alarm-countdown');
const alarmBtnCancel = document.getElementById('alarm-btn-cancel');

// Stopwatch elements
const swMain = document.getElementById('sw-main');
const swMs = document.getElementById('sw-ms');
const swBtnStart = document.getElementById('sw-btn-start');
const swBtnPause = document.getElementById('sw-btn-pause');
const swBtnReset = document.getElementById('sw-btn-reset');
const swBtnLap = document.getElementById('sw-btn-lap');
const swLapsList = document.getElementById('sw-laps-list');

// Alert Overlay elements
const alertOverlay = document.getElementById('alert-overlay');
const alertTitle = document.getElementById('alert-title');
const alertMessage = document.getElementById('alert-message');
const alertBtnDismiss = document.getElementById('alert-btn-dismiss');

// Settings elements
const settingAlwaysOnTop = document.getElementById('setting-always-on-top');
const settingAutoDim = document.getElementById('setting-auto-dim');
const settingDimOpacity = document.getElementById('setting-dim-opacity');
const settingDimOpacityLabel = document.getElementById('setting-dim-opacity-label');
const settingDimOpacityContainer = document.getElementById('setting-dim-opacity-container');
const settingOpacity = document.getElementById('setting-opacity');
const settingOpacityLabel = document.getElementById('setting-opacity-label');
const fontBtns = document.querySelectorAll('.font-btn');

// AI elements
const btnAiSparkle = document.getElementById('btn-ai-sparkle');
const aiAssistantPanel = document.getElementById('ai-assistant-panel');
const aiViewMenu = document.getElementById('ai-view-menu');
const aiViewLoading = document.getElementById('ai-view-loading');
const aiViewResult = document.getElementById('ai-view-result');
const btnAiClose = document.getElementById('btn-ai-close');
const btnAiResultClose = document.getElementById('btn-ai-result-close');
const btnAiReplace = document.getElementById('btn-ai-replace');
const btnAiInsert = document.getElementById('btn-ai-insert');
const btnAiAppend = document.getElementById('btn-ai-append');
const btnAiCopy = document.getElementById('btn-ai-copy');
const btnAiBack = document.getElementById('btn-ai-back');
const aiResultText = document.getElementById('ai-result-text');
const aiCustomInput = document.getElementById('ai-custom-input');
const btnAiSubmit = document.getElementById('btn-ai-submit');
const aiReasoningAccordion = document.getElementById('ai-reasoning-accordion');
const btnToggleReasoning = document.getElementById('btn-toggle-reasoning');
const aiReasoningText = document.getElementById('ai-reasoning-text');
const editorStats = document.getElementById('editor-stats');
const editorToolbar = document.querySelector('.editor-toolbar');

// AI Settings elements
const settingEnableAi = document.getElementById('setting-enable-ai');
const aiSettingsGroup = document.getElementById('ai-settings-group');
const settingAiProvider = document.getElementById('setting-ai-provider');
const settingGeminiKey = document.getElementById('setting-gemini-key');
const settingGeminiModel = document.getElementById('setting-gemini-model');
const settingOpenaiKey = document.getElementById('setting-openai-key');
const settingOpenaiModel = document.getElementById('setting-openai-model');
const settingDeepseekKey = document.getElementById('setting-deepseek-key');
const settingDeepseekModel = document.getElementById('setting-deepseek-model');
const btnTestAi = document.getElementById('btn-test-ai');
const aiTestStatus = document.getElementById('ai-test-status');

// History (Trash) elements
const trashListContainer = document.getElementById('trash-list-container');
const trashEmptyState = document.getElementById('trash-empty-state');
const btnClearTrash = document.getElementById('btn-clear-trash');
const btnRefreshTrash = document.getElementById('btn-refresh-trash');

// Live recording elements
const recordingSource = document.getElementById('recording-source');
const recordingMicrophone = document.getElementById('recording-microphone');
const recordingOpenPermissions = document.getElementById('recording-open-permissions');
const recordingStatus = document.getElementById('recording-status');
const recordingContext = document.getElementById('recording-context');
const recordingStart = document.getElementById('recording-start');
const recordingPause = document.getElementById('recording-pause');
const recordingStop = document.getElementById('recording-stop');
const recordingTranscript = document.getElementById('recording-transcript');
const recordingDuration = document.getElementById('recording-duration');
const recordingCopy = document.getElementById('recording-copy');
const recordingInsert = document.getElementById('recording-insert');
const recordingSummary = document.getElementById('recording-summary');
const recordingSendNotion = document.getElementById('recording-send-notion');
const recordingSendLinear = document.getElementById('recording-send-linear');

// Time (Timer/Alarm/Stopwatch) sub-tab elements
const timeSubtabs = document.querySelectorAll('.time-subtab');
const timeSubpanels = document.querySelectorAll('.time-subpanel');

// Notes Library elements
const librarySearch = document.getElementById('library-search');
const libraryTagFilters = document.getElementById('library-tag-filters');
const libraryList = document.getElementById('library-list');
const libraryEmptyState = document.getElementById('library-empty-state');

// Tags elements
const noteTagsList = document.getElementById('note-tags-list');
const noteTagInput = document.getElementById('note-tag-input');

// Markdown preview / export / reminder / lock elements
const btnNotePreview = document.getElementById('btn-note-preview');
const btnNotePreviewLabel = document.getElementById('btn-note-preview-label');
const notePreview = document.getElementById('note-preview');
const btnNoteExport = document.getElementById('btn-note-export');
const noteExportMenu = document.getElementById('note-export-menu');
const btnNoteRemind = document.getElementById('btn-note-remind');
const noteRemindPopover = document.getElementById('note-remind-popover');
const noteRemindDatetime = document.getElementById('note-remind-datetime');
const btnNoteRemindSet = document.getElementById('btn-note-remind-set');
const btnNoteRemindClear = document.getElementById('btn-note-remind-clear');
const noteRemindActiveLabel = document.getElementById('note-remind-active-label');
const btnNoteLock = document.getElementById('btn-note-lock');
const btnNoteLockLabel = document.getElementById('btn-note-lock-label');
const noteLockOverlay = document.getElementById('note-lock-overlay');
const noteLockPassphraseInput = document.getElementById('note-lock-passphrase-input');
const btnNoteUnlockSubmit = document.getElementById('btn-note-unlock-submit');
const noteLockError = document.getElementById('note-lock-error');

// Advanced AI providers toggle
const btnToggleAdvancedAi = document.getElementById('btn-toggle-advanced-ai');
const aiAdvancedProviders = document.getElementById('ai-advanced-providers');

// Integrations (Notion / Linear)
const settingNotionToken = document.getElementById('setting-notion-token');
const settingNotionDatabase = document.getElementById('setting-notion-database');
const settingLinearToken = document.getElementById('setting-linear-token');
const settingLinearTeam = document.getElementById('setting-linear-team');

// AI result Notion/Linear send buttons
const btnAiSendNotion = document.getElementById('btn-ai-send-notion');
const btnAiSendLinear = document.getElementById('btn-ai-send-linear');

// Account / cloud sync elements
const accountSignedOut = document.getElementById('account-signed-out');
const accountSignedIn = document.getElementById('account-signed-in');
const accountEmailInput = document.getElementById('account-email');
const accountPasswordInput = document.getElementById('account-password');
const btnAccountSignin = document.getElementById('btn-account-signin');
const btnAccountSignup = document.getElementById('btn-account-signup');
const btnAccountSignout = document.getElementById('btn-account-signout');
const accountError = document.getElementById('account-error');
const accountEmailLabel = document.getElementById('account-email-label');
const accountSyncStatus = document.getElementById('account-sync-status');
const btnAccountSyncNow = document.getElementById('btn-account-sync-now');

// State variables
const noteId = window.noteAPI.getNoteId();
let noteConfig = {};
let saveTimeout = null;
let globalConfig = null;
let recordingStreams = [];
let recordingAudioContext = null;
let recordingProcessor = null;
let recordingStartedAt = 0;
let recordingClock = null;
let recordingFinalText = '';
let recordingPartialText = '';
let recordingIsPaused = false;
let recordingSignalTimer = null;
let recordingSignalDetected = false;
let recordingPlatform = '';
let recordingAudioFramesSent = 0;
const RECORDING_TARGET_SAMPLE_RATE = 24000;
const COLOR_CLASSES = ['theme-yellow', 'theme-blue', 'theme-green', 'theme-pink', 'theme-purple', 'theme-dark'];
const VISUAL_STYLE_CLASSES = ['style-paper', 'style-neon', 'style-pastel', 'style-focus', 'style-holo', 'style-terminal'];
const VALID_COLORS = ['yellow', 'blue', 'green', 'pink', 'purple', 'dark'];
const VALID_STYLES = ['paper', 'neon', 'pastel', 'focus', 'holo', 'terminal'];
const COLOR_LABELS = { yellow: 'Yellow', blue: 'Blue', green: 'Green', pink: 'Pink', purple: 'Purple', dark: 'Dark' };
const STYLE_LABELS = { paper: 'Paper', neon: 'Neon', pastel: 'Pastel', focus: 'Focus', holo: 'Holo', terminal: 'Terminal' };
let themeTransitionTimeout = null;
let newNoteAnimationTimeout = null;

function normalizeColor(color) {
  return VALID_COLORS.includes(color) ? color : 'yellow';
}

function normalizeVisualStyle(visualStyle) {
  return VALID_STYLES.includes(visualStyle) ? visualStyle : 'paper';
}

function startThemeTransition() {
  if (themeTransitionTimeout) clearTimeout(themeTransitionTimeout);
  document.body.classList.remove('theme-switching');
  document.body.offsetWidth;
  document.body.classList.add('theme-switching');
  themeTransitionTimeout = setTimeout(() => {
    document.body.classList.remove('theme-switching');
    themeTransitionTimeout = null;
  }, 420);
}

function updateThemePreview(color = noteConfig.color, visualStyle = noteConfig.visualStyle, label = null) {
  if (!themePreviewCard || !themePreviewLabel) return;
  const safeColor = normalizeColor(color);
  const safeStyle = normalizeVisualStyle(visualStyle);
  themePreviewCard.className = `theme-preview-card preview-${safeStyle} preview-color-${safeColor}`;
  themePreviewLabel.textContent = label || `${STYLE_LABELS[safeStyle]} · ${COLOR_LABELS[safeColor]}`;
}

function syncThemeControls() {
  const activeColor = normalizeColor(noteConfig.color);
  const activeStyle = normalizeVisualStyle(noteConfig.visualStyle);
  colorDots.forEach(dot => dot.classList.toggle('active', dot.dataset.color === activeColor));
  styleOptions.forEach(option => option.classList.toggle('active', option.dataset.style === activeStyle));
  presetOptions.forEach(option => {
    option.classList.toggle('active', option.dataset.color === activeColor && option.dataset.style === activeStyle);
  });
  updateThemePreview(activeColor, activeStyle);
}

function applyVisualTheme(color, visualStyle = 'paper', animate = false) {
  const safeColor = normalizeColor(color);
  const safeStyle = normalizeVisualStyle(visualStyle);
  const themeClass = `theme-${safeColor}`;
  const styleClass = `style-${safeStyle}`;
  document.body.classList.remove(...COLOR_CLASSES);
  document.body.classList.remove(...VISUAL_STYLE_CLASSES);
  document.body.classList.add(themeClass);
  document.body.classList.add(styleClass);
  if (animate) startThemeTransition();
}

function setThemeSelection(color, visualStyle, source = 'manual') {
  noteConfig.color = normalizeColor(color);
  noteConfig.visualStyle = normalizeVisualStyle(visualStyle);
  applyVisualTheme(noteConfig.color, noteConfig.visualStyle, true);
  syncThemeControls();
  trackAppEvent('theme_selection_change', {
    color: noteConfig.color,
    style: noteConfig.visualStyle,
    source
  });
  triggerStateSave();
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

// Audio Synthesizer variables
let audioCtx = null;
let alertChimeInterval = null;

// Timer state
let timerInterval = null;
let timerSecondsTotal = 0;
let timerSecondsRemaining = 0;
const CIRCUMFERENCE = 2 * Math.PI * 72; // r = 72

// Alarm state
let activeAlarmTimeStr = null; // "HH:MM"
let alarmCheckerInterval = null;

// Stopwatch state
let swInterval = null;
let swStartTime = 0;
let swElapsedTime = 0;
let swLaps = [];

/* ==========================================================================
   Sound Synthesizer (Web Audio API)
   ========================================================================== */
function playAlertChime() {
  try {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }

    const playNote = (freq, startTime, duration) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);
      
      // Gentle arpeggio envelope
      gain.gain.setValueAtTime(0.0, startTime);
      gain.gain.linearRampToValueAtTime(0.15, startTime + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
      
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      
      osc.start(startTime);
      osc.stop(startTime + duration);
    };

    const now = audioCtx.currentTime;
    // C Major Arpeggio: C5 -> E5 -> G5 -> C6
    playNote(523.25, now, 0.4);
    playNote(659.25, now + 0.12, 0.4);
    playNote(783.99, now + 0.24, 0.5);
    playNote(1046.50, now + 0.36, 0.7);
  } catch (error) {
    console.error('Audio synthesizer error:', error);
  }
}

function startRingingAlert(title, message) {
  alertTitle.textContent = title;
  alertMessage.textContent = message;
  alertOverlay.classList.remove('hidden');

  playAlertChime();
  if (alertChimeInterval) clearInterval(alertChimeInterval);
  alertChimeInterval = setInterval(playAlertChime, 1800);
}

function stopRingingAlert() {
  if (alertChimeInterval) {
    clearInterval(alertChimeInterval);
    alertChimeInterval = null;
  }
  alertOverlay.classList.add('hidden');
}

alertBtnDismiss.addEventListener('click', stopRingingAlert);

function toggleDimOpacityVisibility() {
  if (settingAutoDim.checked) {
    settingDimOpacityContainer.style.display = 'flex';
  } else {
    settingDimOpacityContainer.style.display = 'none';
  }
}

/* ==========================================================================
   Initialization
   ========================================================================== */
async function init() {
  // Setup SVG circular ring
  progressCircle.style.strokeDasharray = `${CIRCUMFERENCE} ${CIRCUMFERENCE}`;
  progressCircle.style.strokeDashoffset = CIRCUMFERENCE;

  // Load Note configuration from main process
  noteConfig = await window.noteAPI.getNoteConfig(noteId);

  // Track app launch via GA
  trackAppEvent('app_launch', { theme: noteConfig.color || 'yellow' });

  // Apply visual theme
  noteConfig.color = normalizeColor(noteConfig.color);
  noteConfig.visualStyle = normalizeVisualStyle(noteConfig.visualStyle);
  applyVisualTheme(noteConfig.color, noteConfig.visualStyle);
  document.body.classList.toggle('collapsed-note', !!noteConfig.collapsed);
  
  syncThemeControls();

  // Load note text
  noteEditor.value = noteConfig.noteText || '';
  updateEditorStats();

  // Load pinned state
  if (noteConfig.alwaysOnTop) {
    btnPin.classList.add('active-pin');
  }
  settingAlwaysOnTop.checked = !!noteConfig.alwaysOnTop;

  // Load opacity setting
  const opacityVal = noteConfig.opacity !== undefined ? noteConfig.opacity : 100;
  settingOpacity.value = opacityVal;
  settingOpacityLabel.textContent = `${opacityVal}%`;

  // Load dim opacity setting
  const dimOpacityVal = noteConfig.dimOpacity !== undefined ? noteConfig.dimOpacity : 45;
  settingDimOpacity.value = dimOpacityVal;
  settingDimOpacityLabel.textContent = `${dimOpacityVal}%`;
  
  // Load auto-dim setting
  settingAutoDim.checked = !!noteConfig.autoDim;
  toggleDimOpacityVisibility();

  // Apply initial window opacity based on active settings and focus state
  updateWindowOpacity();

  // Load font size setting
  const fontSizeVal = noteConfig.fontSize || '13px';
  noteEditor.style.fontSize = fontSizeVal;
  fontBtns.forEach(btn => {
    if (btn.dataset.size === fontSizeVal) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  // Load open tab
  if (noteConfig.tab) {
    switchTab(noteConfig.tab);
  }
  switchTimeSubtab(noteConfig.timeSubtab || 'timer');

  // Load tags
  renderNoteTags();

  // Load lock state
  if (noteConfig.locked) {
    showNoteLockOverlay();
  }

  // Load reminder state
  renderReminderState();

  // Setup alarm clock logic
  startLiveClock();

  // If there was an active alarm, restore it
  if (noteConfig.alarmTime) {
    setAlarm(noteConfig.alarmTime);
  }

  // Load global configuration (AI settings)
  globalConfig = await window.noteAPI.getGlobalConfig();
  initAISettings();
  initAlarmSelects();

  // Load account / cloud sync status
  refreshAccountUI();

  // Listen for pin state changes from keyboard shortcuts
  if (window.noteAPI.onPinStateChanged) {
    window.noteAPI.onPinStateChanged((isPinned) => {
      noteConfig.alwaysOnTop = isPinned;
      settingAlwaysOnTop.checked = isPinned;
      if (isPinned) {
        btnPin.classList.add('active-pin');
      } else {
        btnPin.classList.remove('active-pin');
      }
    });
  }

  // A reminder fired for this note (main process clears remindAt once it does)
  if (window.noteAPI.onReminderFired) {
    window.noteAPI.onReminderFired(() => {
      noteConfig.remindAt = null;
      renderReminderState();
    });
  }

  // Cloud sync pulled a newer copy of this note from another device.
  // Only apply it if the user isn't actively typing, to avoid clobbering local edits.
  if (window.noteAPI.onNoteUpdatedExternally) {
    window.noteAPI.onNoteUpdatedExternally((payload) => {
      if (document.activeElement === noteEditor) return;
      if (typeof payload.noteText === 'string') {
        noteConfig.noteText = payload.noteText;
        noteEditor.value = payload.noteText;
        updateEditorStats();
        if (!notePreview.classList.contains('hidden')) {
          notePreview.innerHTML = renderMarkdownLite(noteEditor.value);
        }
      }
      if (Array.isArray(payload.tags)) {
        noteConfig.tags = payload.tags;
        renderNoteTags();
      }
    });
  }
}

// Debounce save function to reduce filesystem write load
function triggerStateSave() {
  if (saveTimeout) clearTimeout(saveTimeout);
  saveTimeout = setTimeout(() => {
    // Locked notes don't overwrite noteText from the (empty/placeholder) editor
    if (!noteConfig.locked) {
      noteConfig.noteText = noteEditor.value;
    }
    window.noteAPI.updateNoteConfig(noteId, {
      noteText: noteConfig.noteText,
      color: noteConfig.color,
      visualStyle: noteConfig.visualStyle,
      tab: noteConfig.tab,
      timeSubtab: noteConfig.timeSubtab,
      alarmTime: noteConfig.alarmTime,
      opacity: noteConfig.opacity,
      fontSize: noteConfig.fontSize,
      autoDim: noteConfig.autoDim,
      dimOpacity: noteConfig.dimOpacity,
      tags: noteConfig.tags || [],
      locked: !!noteConfig.locked,
      lockSalt: noteConfig.lockSalt,
      lockIv: noteConfig.lockIv,
      lockAuthTag: noteConfig.lockAuthTag,
      lockCiphertext: noteConfig.lockCiphertext,
      remindAt: noteConfig.remindAt || null
    });
  }, 400);
}

/* ==========================================================================
   Window / Header events
   ========================================================================== */
// Create New Note
btnNew.addEventListener('click', () => {
  trackAppEvent('note_create');
  if (newNoteAnimationTimeout) clearTimeout(newNoteAnimationTimeout);
  document.body.classList.add('note-burst');
  newNoteAnimationTimeout = setTimeout(() => {
    document.body.classList.remove('note-burst');
    newNoteAnimationTimeout = null;
    window.noteAPI.createNewNote();
  }, 130);
});

// Delete Current Note
btnDelete.addEventListener('click', () => {
  if (confirm('Are you sure you want to delete this sticky note?')) {
    trackAppEvent('note_delete');
    window.noteAPI.deleteNote(noteId);
  }
});

// Pin (Always on Top) toggle
btnPin.addEventListener('click', () => {
  const isPinned = !btnPin.classList.contains('active-pin');
  if (isPinned) {
    btnPin.classList.add('active-pin');
  } else {
    btnPin.classList.remove('active-pin');
  }
  noteConfig.alwaysOnTop = isPinned;
  settingAlwaysOnTop.checked = isPinned;
  trackAppEvent('note_pin', { active: isPinned });
  window.noteAPI.toggleAlwaysOnTop(noteId, isPinned);
});

let hoverExpandTimeout = null;
let hoverCollapseTimeout = null;

// Collapse / Minimize toggle
btnCollapse.addEventListener('click', async () => {
  // Clear any active hover timeouts
  if (hoverExpandTimeout) clearTimeout(hoverExpandTimeout);
  if (hoverCollapseTimeout) clearTimeout(hoverCollapseTimeout);
  hoverExpandTimeout = null;
  hoverCollapseTimeout = null;

  const isCollapsed = await window.noteAPI.toggleCollapseWindow(noteId);
  noteConfig.collapsed = isCollapsed;
  document.body.classList.toggle('collapsed-note', isCollapsed);
  trackAppEvent('note_collapse', { collapsed: isCollapsed });
});

// Double click header to collapse
const dragHeader = document.querySelector('.drag-header');
if (dragHeader) {
  dragHeader.addEventListener('dblclick', async (e) => {
    // Avoid triggering if clicking on buttons
    if (e.target.closest('.icon-btn')) return;
    
    // Clear any active hover timeouts
    if (hoverExpandTimeout) clearTimeout(hoverExpandTimeout);
    if (hoverCollapseTimeout) clearTimeout(hoverCollapseTimeout);
    hoverExpandTimeout = null;
    hoverCollapseTimeout = null;

    const isCollapsed = await window.noteAPI.toggleCollapseWindow(noteId);
    noteConfig.collapsed = isCollapsed;
    document.body.classList.toggle('collapsed-note', isCollapsed);
    trackAppEvent('note_collapse', { collapsed: isCollapsed });
  });
}

// Hover to reveal when note is collapsed/minimized
document.body.addEventListener('mouseenter', () => {
  if (noteConfig && noteConfig.collapsed) {
    if (hoverCollapseTimeout) {
      clearTimeout(hoverCollapseTimeout);
      hoverCollapseTimeout = null;
    }
    
    if (!hoverExpandTimeout) {
      hoverExpandTimeout = setTimeout(async () => {
        document.body.classList.remove('collapsed-note');
        await window.noteAPI.tempExpandWindow(noteId);
      }, 120); // 120ms debounce (stops jumpy expansion when swiping)
    }
  }
});

document.body.addEventListener('mouseleave', () => {
  if (noteConfig && noteConfig.collapsed) {
    if (hoverExpandTimeout) {
      clearTimeout(hoverExpandTimeout);
      hoverExpandTimeout = null;
    }
    
    if (!hoverCollapseTimeout) {
      hoverCollapseTimeout = setTimeout(async () => {
        document.body.classList.add('collapsed-note');
        await window.noteAPI.tempCollapseWindow(noteId);
      }, 220); // 220ms buffer (keeps note open if mouse briefly slips out)
    }
  }
});


// Settings Event Listeners
settingAlwaysOnTop.addEventListener('change', () => {
  const isPinned = settingAlwaysOnTop.checked;
  if (isPinned) {
    btnPin.classList.add('active-pin');
  } else {
    btnPin.classList.remove('active-pin');
  }
  noteConfig.alwaysOnTop = isPinned;
  window.noteAPI.toggleAlwaysOnTop(noteId, isPinned);
});

settingOpacity.addEventListener('input', () => {
  const val = settingOpacity.value;
  settingOpacityLabel.textContent = `${val}%`;
  noteConfig.opacity = val;
  updateWindowOpacity();
  triggerStateSave();
});

settingAutoDim.addEventListener('change', () => {
  noteConfig.autoDim = settingAutoDim.checked;
  toggleDimOpacityVisibility();
  updateWindowOpacity();
  triggerStateSave();
});

settingDimOpacity.addEventListener('input', () => {
  const val = settingDimOpacity.value;
  settingDimOpacityLabel.textContent = `${val}%`;
  noteConfig.dimOpacity = val;
  updateWindowOpacity();
  triggerStateSave();
});

// Focus/Blur Window Opacity Management
function updateWindowOpacity() {
  const activeOpacity = (noteConfig.opacity !== undefined ? noteConfig.opacity : 100) / 100;
  const dimOpacity = (noteConfig.dimOpacity !== undefined ? noteConfig.dimOpacity : 45) / 100;
  const isFocused = document.hasFocus();
  
  if (!isFocused && noteConfig.autoDim) {
    // Fade the note down to a lower visibility layer when not focused
    document.querySelector('.glass-container').style.opacity = Math.min(activeOpacity, dimOpacity);
  } else {
    document.querySelector('.glass-container').style.opacity = activeOpacity;
  }
}

window.addEventListener('focus', updateWindowOpacity);
window.addEventListener('blur', updateWindowOpacity);

fontBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    fontBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    
    const size = btn.dataset.size;
    noteEditor.style.fontSize = size;
    noteConfig.fontSize = size;
    triggerStateSave();
  });
});

// Toggle Color Palette Drawer
btnColor.addEventListener('click', () => {
  colorPalette.classList.toggle('hidden');
});

// Hide color palette when clicking outside
document.addEventListener('click', (e) => {
  if (!colorPalette.contains(e.target) && !btnColor.contains(e.target)) {
    colorPalette.classList.add('hidden');
  }
});

// Color dots selectors
colorDots.forEach(dot => {
  const previewColor = dot.dataset.color;
  dot.addEventListener('mouseenter', () => updateThemePreview(previewColor, noteConfig.visualStyle));
  dot.addEventListener('focus', () => updateThemePreview(previewColor, noteConfig.visualStyle));
  dot.addEventListener('click', () => {
    if (window.noteAPI && window.noteAPI.logMsg) {
      window.noteAPI.logMsg(`Color dot clicked. Dataset color: ${dot.dataset.color}`);
    }
    const chosenColor = dot.dataset.color;
    if (window.noteAPI && window.noteAPI.logMsg) {
      window.noteAPI.logMsg(`Applying theme class: theme-${chosenColor}`);
    }
    setThemeSelection(chosenColor, noteConfig.visualStyle, 'color');
  });
});

styleOptions.forEach(option => {
  const previewStyle = option.dataset.style || 'paper';
  option.addEventListener('mouseenter', () => updateThemePreview(noteConfig.color, previewStyle));
  option.addEventListener('focus', () => updateThemePreview(noteConfig.color, previewStyle));
  option.addEventListener('click', () => {
    const chosenStyle = option.dataset.style || 'paper';
    setThemeSelection(noteConfig.color, chosenStyle, 'style');
  });
});

presetOptions.forEach(option => {
  const presetColor = option.dataset.color || 'yellow';
  const presetStyle = option.dataset.style || 'paper';
  const presetLabel = option.textContent.trim();
  option.addEventListener('mouseenter', () => updateThemePreview(presetColor, presetStyle, presetLabel));
  option.addEventListener('focus', () => updateThemePreview(presetColor, presetStyle, presetLabel));
  option.addEventListener('click', () => {
    setThemeSelection(presetColor, presetStyle, `preset:${option.dataset.preset || presetLabel.toLowerCase()}`);
  });
});

colorPalette.addEventListener('mouseleave', () => syncThemeControls());

// Auto-save on note edit and update statistics
noteEditor.addEventListener('input', () => {
  updateEditorStats();
  triggerStateSave();
  if (!window.lastEditTrackTime || Date.now() - window.lastEditTrackTime > 60000) {
    trackAppEvent('note_edit', { char_count: noteEditor.value.length });
    window.lastEditTrackTime = Date.now();
  }
});

/* ==========================================================================
   Tab Navigation Logic
   ========================================================================== */
function switchTab(tabName) {
  navItems.forEach(item => {
    if (item.dataset.tab === tabName) {
      item.classList.add('active');
    } else {
      item.classList.remove('active');
    }
  });

  panels.forEach(panel => {
    if (panel.id === `panel-${tabName}`) {
      panel.classList.add('active');
    } else {
      panel.classList.remove('active');
    }
  });

  if (tabName !== 'note') {
    closeAIPanel();
  }

  if (tabName === 'history') {
    loadAndRenderTrash();
  }

  if (tabName === 'recording') {
    refreshRecordingSources();
  }

  if (tabName === 'library') {
    loadNotesLibrary();
  }

  noteConfig.tab = tabName;
  triggerStateSave();
}

navItems.forEach(item => {
  item.addEventListener('click', () => {
    switchTab(item.dataset.tab);
  });
});

/* ==========================================================================
   Time sub-tabs (Timer / Alarm / Stopwatch consolidated under one nav item)
   ========================================================================== */
function switchTimeSubtab(subtabName) {
  timeSubtabs.forEach(btn => btn.classList.toggle('active', btn.dataset.subtab === subtabName));
  timeSubpanels.forEach(panel => panel.classList.toggle('active', panel.id === `subpanel-${subtabName}`));
  noteConfig.timeSubtab = subtabName;
  triggerStateSave();
}

timeSubtabs.forEach(btn => {
  btn.addEventListener('click', () => switchTimeSubtab(btn.dataset.subtab));
});

/* ==========================================================================
   Stopwatch Component
   ========================================================================== */
function formatStopwatchTime(ms) {
  const totalSecs = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSecs / 60).toString().padStart(2, '0');
  const seconds = (totalSecs % 60).toString().padStart(2, '0');
  const centiseconds = Math.floor((ms % 1000) / 10).toString().padStart(2, '0');
  return { main: `${minutes}:${seconds}`, ms: `.${centiseconds}` };
}

function updateStopwatchUI() {
  const time = formatStopwatchTime(swElapsedTime);
  swMain.textContent = time.main;
  swMs.textContent = time.ms;
}

swBtnStart.addEventListener('click', () => {
  swStartTime = Date.now() - swElapsedTime;
  swInterval = setInterval(() => {
    swElapsedTime = Date.now() - swStartTime;
    updateStopwatchUI();
  }, 10);

  swBtnStart.classList.add('hidden');
  swBtnPause.classList.remove('hidden');
  swBtnReset.classList.add('hidden');
  swBtnLap.disabled = false;
  trackAppEvent('stopwatch_start');
});

swBtnPause.addEventListener('click', () => {
  clearInterval(swInterval);
  swInterval = null;

  swBtnPause.classList.add('hidden');
  swBtnStart.classList.remove('hidden');
  swBtnReset.classList.remove('hidden');
  swBtnLap.disabled = true;
});

swBtnReset.addEventListener('click', () => {
  clearInterval(swInterval);
  swInterval = null;
  swElapsedTime = 0;
  swLaps = [];
  updateStopwatchUI();

  swBtnReset.classList.add('hidden');
  swBtnPause.classList.add('hidden');
  swBtnStart.classList.remove('hidden');
  swBtnLap.disabled = true;
  swLapsList.innerHTML = '';
});

swBtnLap.addEventListener('click', () => {
  swLaps.unshift(swElapsedTime);
  const lapLi = document.createElement('li');
  const lapNum = swLaps.length;
  
  const lapTimeFormatted = formatStopwatchTime(swElapsedTime);
  
  lapLi.innerHTML = `
    <span class="lap-num">Lap ${lapNum}</span>
    <span class="lap-time">${lapTimeFormatted.main}${lapTimeFormatted.ms}</span>
  `;
  
  swLapsList.insertBefore(lapLi, swLapsList.firstChild);
});

/* ==========================================================================
   Timer Component
   ========================================================================== */
function updateTimerCircle(remaining, total) {
  if (total <= 0) {
    progressCircle.style.strokeDashoffset = CIRCUMFERENCE;
    return;
  }
  const pct = remaining / total;
  const offset = CIRCUMFERENCE - (pct * CIRCUMFERENCE);
  progressCircle.style.strokeDashoffset = offset;
}

function formatTimerLabel(sec) {
  const m = Math.floor(sec / 60).toString().padStart(2, '0');
  const s = (sec % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

function startTimer() {
  if (timerInterval) clearInterval(timerInterval);

  timerInterval = setInterval(() => {
    if (timerSecondsRemaining <= 0) {
      clearInterval(timerInterval);
      timerInterval = null;
      
      // Timer finished! Ring the alert
      startRingingAlert("Timer's Up!", "Your countdown timer has finished.");
      resetTimerState();
      return;
    }

    timerSecondsRemaining--;
    timerLabel.textContent = formatTimerLabel(timerSecondsRemaining);
    updateTimerCircle(timerSecondsRemaining, timerSecondsTotal);
  }, 1000);
}

function resetTimerState() {
  if (timerInterval) clearInterval(timerInterval);
  timerInterval = null;
  
  timerLabel.textContent = "00:00";
  progressCircle.style.strokeDashoffset = CIRCUMFERENCE;
  
  timerInputs.classList.remove('hidden');
  timerLabel.classList.add('hidden');

  timerBtnStart.classList.remove('hidden');
  timerBtnPause.classList.add('hidden');
  timerBtnReset.classList.add('hidden');
}

timerBtnStart.addEventListener('click', () => {
  const mins = parseInt(timerMinInput.value) || 0;
  const secs = parseInt(timerSecInput.value) || 0;
  
  const total = mins * 60 + secs;
  if (total <= 0) return;

  // Set times
  timerSecondsTotal = total;
  timerSecondsRemaining = total;
  
  // Transition views
  timerInputs.classList.add('hidden');
  timerLabel.classList.remove('hidden');
  timerLabel.textContent = formatTimerLabel(timerSecondsRemaining);
  updateTimerCircle(timerSecondsRemaining, timerSecondsTotal);

  // Buttons transition
  timerBtnStart.classList.add('hidden');
  timerBtnPause.classList.remove('hidden');
  trackAppEvent('timer_start', { duration_sec: total });
  timerBtnReset.classList.remove('hidden');

  startTimer();
});

timerBtnPause.addEventListener('click', () => {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
    timerBtnPause.textContent = 'Resume';
  } else {
    startTimer();
    timerBtnPause.textContent = 'Pause';
  }
});

timerBtnReset.addEventListener('click', () => {
  resetTimerState();
  timerBtnPause.textContent = 'Pause';
});

// Restrict timer inputs to proper ranges and lengths
timerMinInput.addEventListener('change', () => {
  let val = parseInt(timerMinInput.value) || 0;
  if (val < 0) val = 0;
  if (val > 99) val = 99;
  timerMinInput.value = val.toString().padStart(2, '0');
});

timerSecInput.addEventListener('change', () => {
  let val = parseInt(timerSecInput.value) || 0;
  if (val < 0) val = 0;
  if (val > 59) val = 59;
  timerSecInput.value = val.toString().padStart(2, '0');
});

/* ==========================================================================
   Alarm Component
   ========================================================================== */
function startLiveClock() {
  const updateClock = () => {
    const now = new Date();
    const hrs = now.getHours().toString().padStart(2, '0');
    const mins = now.getMinutes().toString().padStart(2, '0');
    const secs = now.getSeconds().toString().padStart(2, '0');
    alarmClock.textContent = `${hrs}:${mins}:${secs}`;
  };

  updateClock();
  setInterval(updateClock, 1000);
}

function setAlarm(timeStr) {
  noteConfig.alarmTime = timeStr;
  activeAlarmTimeStr = timeStr;

  // Format visual display e.g. "14:30" -> "02:30 PM"
  const [h24, m] = timeStr.split(':');
  const hNum = parseInt(h24);
  const period = hNum >= 12 ? 'PM' : 'AM';
  const h12 = (hNum % 12 || 12).toString().padStart(2, '0');
  
  activeAlarmTime.textContent = `${h12}:${m} ${period}`;
  alarmStatusCard.classList.remove('hidden');

  // Activate checking interval
  if (alarmCheckerInterval) clearInterval(alarmCheckerInterval);
  
  const checkAlarm = () => {
    const now = new Date();
    const curHrs = now.getHours().toString().padStart(2, '0');
    const curMins = now.getMinutes().toString().padStart(2, '0');
    const curTimeStr = `${curHrs}:${curMins}`;

    // Compute countdown text
    const target = new Date();
    target.setHours(parseInt(h24), parseInt(m), 0, 0);
    if (target < now) {
      target.setDate(target.getDate() + 1); // Set for tomorrow if time has passed
    }

    const diffMs = target - now;
    const diffMins = Math.ceil(diffMs / (1000 * 60));
    
    if (diffMins >= 60) {
      const diffHrs = Math.floor(diffMins / 60);
      const remainingMins = diffMins % 60;
      activeAlarmCountdown.textContent = `in ${diffHrs}h ${remainingMins}m`;
    } else {
      activeAlarmCountdown.textContent = `in ${diffMins}m`;
    }

    // Trigger check
    if (curTimeStr === activeAlarmTimeStr) {
      clearInterval(alarmCheckerInterval);
      alarmCheckerInterval = null;
      cancelAlarm();
      
      // Trigger alarm alert
      startRingingAlert("Alarm ringing!", `Set for ${h12}:${m} ${period}`);
    }
  };

  checkAlarm();
  alarmCheckerInterval = setInterval(checkAlarm, 5000); // Check every 5s

  triggerStateSave();
}

function cancelAlarm() {
  noteConfig.alarmTime = null;
  activeAlarmTimeStr = null;
  alarmStatusCard.classList.add('hidden');
  
  if (alarmCheckerInterval) {
    clearInterval(alarmCheckerInterval);
    alarmCheckerInterval = null;
  }

  triggerStateSave();
}

alarmBtnSet.addEventListener('click', () => {
  const hourVal = parseInt(alarmHourTrigger.textContent, 10);
  const minuteVal = alarmMinuteTrigger.textContent;
  const ampmVal = alarmAmpmToggle.textContent;
  
  if (isNaN(hourVal) || !minuteVal) return;
  
  // Convert 12-hour values to 24-hour format (HH:MM)
  let hour24 = hourVal;
  if (ampmVal === 'PM' && hourVal < 12) {
    hour24 = hourVal + 12;
  } else if (ampmVal === 'AM' && hourVal === 12) {
    hour24 = 0;
  }
  
  const alarmVal = `${hour24.toString().padStart(2, '0')}:${minuteVal}`;
  setAlarm(alarmVal);
  trackAppEvent('alarm_set', { alarm_time: alarmVal });
});

alarmBtnCancel.addEventListener('click', cancelAlarm);

// Toggle custom dropdown menus on click
alarmHourTrigger.addEventListener('click', (e) => {
  e.stopPropagation();
  const isHidden = alarmHourMenu.classList.toggle('hidden');
  alarmHourTrigger.classList.toggle('open', !isHidden);
  
  alarmMinuteMenu.classList.add('hidden');
  alarmMinuteTrigger.classList.remove('open');
});

alarmMinuteTrigger.addEventListener('click', (e) => {
  e.stopPropagation();
  const isHidden = alarmMinuteMenu.classList.toggle('hidden');
  alarmMinuteTrigger.classList.toggle('open', !isHidden);
  
  alarmHourMenu.classList.add('hidden');
  alarmHourTrigger.classList.remove('open');
  
  // Smooth scroll to the selected item if opening
  if (!isHidden) {
    const selected = alarmMinuteMenu.querySelector('.dropdown-item.selected');
    if (selected) {
      setTimeout(() => {
        alarmMinuteMenu.scrollTop = selected.offsetTop - (alarmMinuteMenu.clientHeight / 2) + (selected.clientHeight / 2);
      }, 0);
    }
  }
});

// AM/PM Toggle Button Click Handler
alarmAmpmToggle.addEventListener('click', () => {
  alarmAmpmToggle.textContent = alarmAmpmToggle.textContent === 'AM' ? 'PM' : 'AM';
  alarmHourMenu.classList.add('hidden');
  alarmHourTrigger.classList.remove('open');
  alarmMinuteMenu.classList.add('hidden');
  alarmMinuteTrigger.classList.remove('open');
});

// Close all custom dropdowns when clicking outside
document.addEventListener('click', (e) => {
  if (!e.target.closest('#dropdown-hour-container')) {
    alarmHourMenu.classList.add('hidden');
    alarmHourTrigger.classList.remove('open');
  }
  if (!e.target.closest('#dropdown-minute-container')) {
    alarmMinuteMenu.classList.add('hidden');
    alarmMinuteTrigger.classList.remove('open');
  }
});

// Populate and initialize Custom Alarm Dropdown Menus dynamically
function initAlarmSelects() {
  if (!alarmHourTrigger || !alarmHourMenu || !alarmMinuteTrigger || !alarmMinuteMenu || !alarmAmpmToggle) return;
  
  // 1. Populate Hour Dropdown Menu (01-12)
  alarmHourMenu.innerHTML = '';
  for (let i = 1; i <= 12; i++) {
    const hourStr = i.toString().padStart(2, '0');
    const item = document.createElement('div');
    item.className = 'dropdown-item';
    item.textContent = hourStr;
    
    item.addEventListener('click', (e) => {
      e.stopPropagation();
      alarmHourTrigger.textContent = hourStr;
      
      // Update selected class
      alarmHourMenu.querySelectorAll('.dropdown-item').forEach(el => el.classList.remove('selected'));
      item.classList.add('selected');
      alarmHourMenu.classList.add('hidden');
      alarmHourTrigger.classList.remove('open');
    });
    alarmHourMenu.appendChild(item);
  }
  
  // 2. Populate Minute Dropdown Menu (00-59)
  alarmMinuteMenu.innerHTML = '';
  for (let i = 0; i < 60; i++) {
    const minStr = i.toString().padStart(2, '0');
    const item = document.createElement('div');
    item.className = 'dropdown-item';
    item.textContent = minStr;
    
    item.addEventListener('click', (e) => {
      e.stopPropagation();
      alarmMinuteTrigger.textContent = minStr;
      
      // Update selected class
      alarmMinuteMenu.querySelectorAll('.dropdown-item').forEach(el => el.classList.remove('selected'));
      item.classList.add('selected');
      alarmMinuteMenu.classList.add('hidden');
      alarmMinuteTrigger.classList.remove('open');
    });
    alarmMinuteMenu.appendChild(item);
  }
  
  // 3. Set Default Selection to the Current System Time
  const now = new Date();
  let currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const ampm = currentHour >= 12 ? 'PM' : 'AM';
  
  currentHour = currentHour % 12;
  if (currentHour === 0) currentHour = 12;
  
  const hourStr = currentHour.toString().padStart(2, '0');
  const minStr = currentMinute.toString().padStart(2, '0');
  
  alarmHourTrigger.textContent = hourStr;
  alarmMinuteTrigger.textContent = minStr;
  alarmAmpmToggle.textContent = ampm;
  
  // Mark default items as selected
  const hourItems = alarmHourMenu.querySelectorAll('.dropdown-item');
  hourItems.forEach(item => {
    if (item.textContent === hourStr) item.classList.add('selected');
  });
  
  const minItems = alarmMinuteMenu.querySelectorAll('.dropdown-item');
  minItems.forEach(item => {
    if (item.textContent === minStr) item.classList.add('selected');
  });
}

/* ==========================================================================
   AI Assistant & Provider Settings Logic
   ========================================================================== */

function initAISettings() {
  if (!globalConfig) return;
  
  // Set Enable AI Toggle
  const enableAi = globalConfig.enableAi !== false;
  settingEnableAi.checked = enableAi;
  updateAIVisibility();

  // Set active provider
  const activeProvider = globalConfig.activeProvider || 'gemini';
  settingAiProvider.value = activeProvider;
  
  // Update visibility of provider sections
  updateAIProviderVisibility(activeProvider);
  
  // Populate Gemini values
  const geminiConfig = globalConfig.providers?.gemini || { apiKey: '', model: 'gemini-2.5-flash' };
  settingGeminiKey.value = geminiConfig.apiKey || '';
  settingGeminiModel.value = geminiConfig.model || 'gemini-2.5-flash';
  
  // Populate OpenAI values
  const openaiConfig = globalConfig.providers?.openai || { apiKey: '', model: 'gpt-4o-mini' };
  settingOpenaiKey.value = openaiConfig.apiKey || '';
  settingOpenaiModel.value = openaiConfig.model || 'gpt-4o-mini';
  
  // Populate DeepSeek values
  const deepseekConfig = globalConfig.providers?.deepseek || { apiKey: '', model: 'deepseek-chat' };
  settingDeepseekKey.value = deepseekConfig.apiKey || '';
  settingDeepseekModel.value = deepseekConfig.model || 'deepseek-chat';
}

function updateAIProviderVisibility(provider) {
  const configs = {
    gemini: document.getElementById('ai-config-gemini'),
    openai: document.getElementById('ai-config-openai'),
    deepseek: document.getElementById('ai-config-deepseek')
  };
  
  Object.keys(configs).forEach(key => {
    if (configs[key]) {
      if (key === provider) {
        configs[key].classList.remove('hidden');
      } else {
        configs[key].classList.add('hidden');
      }
    }
  });
}

function updateAIVisibility() {
  const enabled = settingEnableAi.checked;
  
  if (enabled) {
    editorToolbar.classList.remove('hidden');
    aiSettingsGroup.classList.remove('hidden');
  } else {
    editorToolbar.classList.add('hidden');
    aiSettingsGroup.classList.add('hidden');
    closeAIPanel();
  }
}

function updateEditorStats() {
  if (!editorStats || !noteEditor) return;
  const text = noteEditor.value || '';
  const chars = text.length;
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  editorStats.textContent = `${chars} chars | ${words} words`;
}

function saveGlobalConfig() {
  if (!globalConfig) {
    globalConfig = {
      enableAi: true,
      activeProvider: 'gemini',
      providers: {
        gemini: { apiKey: '', model: 'gemini-2.5-flash' },
        openai: { apiKey: '', model: 'gpt-4o-mini' },
        deepseek: { apiKey: '', model: 'deepseek-chat' }
      }
    };
  }
  
  globalConfig.enableAi = settingEnableAi.checked;
  globalConfig.activeProvider = settingAiProvider.value;
  
  globalConfig.providers = {
    gemini: {
      apiKey: settingGeminiKey.value.trim(),
      model: settingGeminiModel.value
    },
    openai: {
      apiKey: settingOpenaiKey.value.trim(),
      model: settingOpenaiModel.value
    },
    deepseek: {
      apiKey: settingDeepseekKey.value.trim(),
      model: settingDeepseekModel.value
    }
  };
  
  window.noteAPI.updateGlobalConfig(globalConfig);
}

// Bind settings events
settingEnableAi.addEventListener('change', () => {
  updateAIVisibility();
  saveGlobalConfig();
});

settingAiProvider.addEventListener('change', () => {
  updateAIProviderVisibility(settingAiProvider.value);
  saveGlobalConfig();
});

[settingGeminiKey, settingGeminiModel, settingOpenaiKey, settingOpenaiModel, settingDeepseekKey, settingDeepseekModel].forEach(input => {
  input.addEventListener('input', saveGlobalConfig);
  input.addEventListener('change', saveGlobalConfig);
});

// Toggle password visibility
const passwordToggles = document.querySelectorAll('.toggle-password-btn');
passwordToggles.forEach(btn => {
  btn.addEventListener('click', () => {
    const targetId = btn.dataset.target;
    const targetInput = document.getElementById(targetId);
    const eyeIcon = btn.querySelector('.eye-icon');
    const eyeOffIcon = btn.querySelector('.eye-off-icon');
    
    if (targetInput.type === 'password') {
      targetInput.type = 'text';
      if (eyeIcon) eyeIcon.classList.add('hidden');
      if (eyeOffIcon) eyeOffIcon.classList.remove('hidden');
    } else {
      targetInput.type = 'password';
      if (eyeIcon) eyeIcon.classList.remove('hidden');
      if (eyeOffIcon) eyeOffIcon.classList.add('hidden');
    }
  });
});

// Test Connection
btnTestAi.addEventListener('click', testAIConnection);

async function testAIConnection() {
  btnTestAi.disabled = true;
  aiTestStatus.textContent = 'Testing...';
  aiTestStatus.className = 'ai-status-badge';
  
  const provider = settingAiProvider.value;
  let apiKey = '';
  let model = '';
  
  if (provider === 'gemini') {
    apiKey = settingGeminiKey.value.trim();
    model = settingGeminiModel.value;
  } else if (provider === 'openai') {
    apiKey = settingOpenaiKey.value.trim();
    model = settingOpenaiModel.value;
  } else if (provider === 'deepseek') {
    apiKey = settingDeepseekKey.value.trim();
    model = settingDeepseekModel.value;
  }
  
  if (!apiKey) {
    aiTestStatus.textContent = 'Missing API Key';
    aiTestStatus.className = 'ai-status-badge error';
    btnTestAi.disabled = false;
    return;
  }
  
  try {
    let responseText = '';
    const testPrompt = 'Respond with only the word: SUCCESS';
    
    if (provider === 'gemini') {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: testPrompt }] }]
        })
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `HTTP ${res.status}`);
      }
      
      const data = await res.json();
      responseText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    } else if (provider === 'openai') {
      const url = 'https://api.openai.com/v1/chat/completions';
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: model,
          messages: [{ role: 'user', content: testPrompt }],
          max_tokens: 10
        })
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `HTTP ${res.status}`);
      }
      
      const data = await res.json();
      responseText = data.choices?.[0]?.message?.content || '';
    } else if (provider === 'deepseek') {
      const url = 'https://api.deepseek.com/v1/chat/completions';
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: model,
          messages: [{ role: 'user', content: testPrompt }],
          max_tokens: 10
        })
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `HTTP ${res.status}`);
      }
      
      const data = await res.json();
      responseText = data.choices?.[0]?.message?.content || '';
    }
    
    if (responseText.toUpperCase().includes('SUCCESS')) {
      aiTestStatus.textContent = 'Connected!';
      aiTestStatus.className = 'ai-status-badge success';
    } else {
      aiTestStatus.textContent = 'Invalid Response';
      aiTestStatus.className = 'ai-status-badge error';
    }
  } catch (err) {
    console.error('Test Connection Error:', err);
    aiTestStatus.textContent = err.message || 'Error';
    aiTestStatus.className = 'ai-status-badge error';
  } finally {
    btnTestAi.disabled = false;
  }
}

// Floating AI Assistant Panel Actions
let aiResultCache = '';
let aiReasoningCache = '';
let lastAIAction = '';

btnAiSparkle.addEventListener('click', () => {
  if (noteConfig.tab !== 'note') {
    switchTab('note');
  }
  const isHidden = aiAssistantPanel.classList.contains('hidden');
  if (isHidden) {
    openAIPanel();
  } else {
    closeAIPanel();
  }
});

btnAiClose.addEventListener('click', closeAIPanel);
btnAiResultClose.addEventListener('click', closeAIPanel);

function openAIPanel() {
  aiAssistantPanel.classList.remove('hidden');
  btnAiSparkle.classList.add('active-ai');
  btnAiSparkle.querySelector('span').textContent = 'Close AI';
  btnAiSparkle.querySelector('svg').innerHTML = '<line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line>';
  showAIView('menu');
  
  // Focus custom prompt input
  setTimeout(() => aiCustomInput.focus(), 100);
}

function closeAIPanel() {
  aiAssistantPanel.classList.add('hidden');
  btnAiSparkle.classList.remove('active-ai');
  btnAiSparkle.querySelector('span').textContent = 'AI Assistant';
  btnAiSparkle.querySelector('svg').innerHTML = '<path d="M15 4V2M15 16v-2M8 9h2M20 9h2M13 5l1 1M18 10l-1-1M3 21l9-9M12.2 11.8l1-1"/>';
}

function showAIView(viewName) {
  aiViewMenu.classList.add('hidden');
  aiViewLoading.classList.add('hidden');
  aiViewResult.classList.add('hidden');
  
  if (viewName === 'menu') {
    aiViewMenu.classList.remove('hidden');
  } else if (viewName === 'loading') {
    aiViewLoading.classList.remove('hidden');
  } else if (viewName === 'result') {
    aiViewResult.classList.remove('hidden');
  }
}

// Quick Actions Event Listeners
const aiMenuBtns = document.querySelectorAll('.ai-menu-btn');
aiMenuBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    const action = btn.dataset.action;
    triggerAIAction(action);
  });
});

btnAiSubmit.addEventListener('click', () => {
  const customPromptText = aiCustomInput.value.trim();
  if (!customPromptText) return;
  triggerAIAction('custom', customPromptText);
});

aiCustomInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    const customPromptText = aiCustomInput.value.trim();
    if (!customPromptText) return;
    triggerAIAction('custom', customPromptText);
  }
});

async function triggerAIAction(action, customText = '') {
  lastAIAction = action;
  const provider = globalConfig ? globalConfig.activeProvider || 'gemini' : 'gemini';
  const apiKey = globalConfig && globalConfig.providers?.[provider]?.apiKey;
  trackAppEvent('ai_query', { provider, action });
  
  if (!apiKey) {
    alert(`Please set your API Key for ${provider.toUpperCase()} in Settings first.`);
    switchTab('settings');
    
    // Focus the target API Key input
    setTimeout(() => {
      const inputEl = document.getElementById(`setting-${provider}-key`);
      if (inputEl) {
        inputEl.focus();
        inputEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 400);
    closeAIPanel();
    return;
  }
  
  const noteText = noteEditor.value.trim();
  if (!noteText && action !== 'brainstorm' && action !== 'custom') {
    alert('Please write some text in the note first!');
    return;
  }
  
  let finalPrompt = '';
  switch (action) {
    case 'improve':
      finalPrompt = `You are a helpful writing assistant. Improve the following sticky note content by making it clearer, correcting grammar, and improving tone, but keeping it concise. Return ONLY the improved note content without comments, introductions or markdown formatting. If the content is empty, return an empty string.\n\nSticky Note Content:\n${noteText}`;
      break;
    case 'summarize':
      finalPrompt = `Create a concise summary of the following sticky note content. Focus on key details. Return ONLY the summary without any introduction or formatting.\n\nSticky Note Content:\n${noteText}`;
      break;
    case 'todos':
      finalPrompt = `Extract action items or tasks from the following sticky note content. Format them as a clean list using markdown task checkboxes (e.g. - [ ] task). Only list the items found. Return ONLY the tasks list.\n\nSticky Note Content:\n${noteText}`;
      break;
    case 'brainstorm':
      finalPrompt = `Based on the following sticky note content, brainstorm 3-5 creative ideas, expansion points, or next steps. Keep it short and readable.\n\nSticky Note Content:\n${noteText}`;
      break;
    case 'custom':
      finalPrompt = `You are an AI assistant. Follow this instruction for the sticky note: "${customText}".\n\nSticky Note Content:\n${noteText}`;
      break;
  }
  
  showAIView('loading');
  
  try {
    const model = globalConfig.providers[provider].model;
    let resultText = '';
    let reasoningText = '';
    
    if (provider === 'gemini') {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: finalPrompt }] }]
        })
      });
      
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error?.message || `HTTP error ${res.status}`);
      }
      
      const data = await res.json();
      resultText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    } else if (provider === 'openai') {
      const url = 'https://api.openai.com/v1/chat/completions';
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: model,
          messages: [{ role: 'user', content: finalPrompt }]
        })
      });
      
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error?.message || `HTTP error ${res.status}`);
      }
      
      const data = await res.json();
      resultText = data.choices?.[0]?.message?.content || '';
    } else if (provider === 'deepseek') {
      const url = 'https://api.deepseek.com/v1/chat/completions';
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: model,
          messages: [{ role: 'user', content: finalPrompt }]
        })
      });
      
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error?.message || `HTTP error ${res.status}`);
      }
      
      const data = await res.json();
      resultText = data.choices?.[0]?.message?.content || '';
      // Parse reasoning if it's DeepSeek Reasoner
      reasoningText = data.choices?.[0]?.message?.reasoning_content || '';
    }
    
    // Cache result
    aiResultCache = resultText;
    aiReasoningCache = reasoningText;
    
    // Render result
    aiResultText.textContent = resultText;
    
    // Handle reasoning accordion
    if (reasoningText) {
      aiReasoningText.textContent = reasoningText;
      aiReasoningAccordion.classList.remove('hidden');
      aiReasoningAccordion.classList.remove('expanded'); // Start collapsed
    } else {
      aiReasoningAccordion.classList.add('hidden');
    }
    
    btnAiSendNotion.classList.toggle('hidden', action !== 'todos');
    btnAiSendLinear.classList.toggle('hidden', action !== 'todos');

    showAIView('result');
  } catch (err) {
    console.error('AI Generation Failed:', err);
    alert(`AI request failed: ${err.message}`);
    showAIView('menu');
  }
}

btnAiSendNotion.addEventListener('click', async () => {
  const token = settingNotionToken.value.trim();
  const database = settingNotionDatabase.value.trim();
  if (!token || !database) {
    alert('Add your Notion API token and database ID in Settings → Integrations first.');
    switchTab('settings');
    return;
  }
  btnAiSendNotion.disabled = true;
  const result = await window.noteAPI.sendTasksToNotion({ token, database, text: aiResultCache });
  btnAiSendNotion.disabled = false;
  if (result && result.error) alert(`Notion send failed: ${result.error}`);
  else alert(`Sent ${result?.count || 0} task(s) to Notion.`);
});

btnAiSendLinear.addEventListener('click', async () => {
  const token = settingLinearToken.value.trim();
  const team = settingLinearTeam.value.trim();
  if (!token || !team) {
    alert('Add your Linear API key and team ID in Settings → Integrations first.');
    switchTab('settings');
    return;
  }
  btnAiSendLinear.disabled = true;
  const result = await window.noteAPI.sendTasksToLinear({ token, team, text: aiResultCache });
  btnAiSendLinear.disabled = false;
  if (result && result.error) alert(`Linear send failed: ${result.error}`);
  else alert(`Created ${result?.count || 0} issue(s) in Linear.`);
});

// Result actions
btnAiBack.addEventListener('click', () => {
  showAIView('menu');
});

btnAiCopy.addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(aiResultCache);
    const originalText = btnAiCopy.textContent;
    btnAiCopy.textContent = 'Copied!';
    setTimeout(() => { btnAiCopy.textContent = originalText; }, 1500);
  } catch (err) {
    console.error('Clipboard copy failed:', err);
  }
});

btnAiReplace.addEventListener('click', () => {
  noteEditor.value = aiResultCache;
  triggerStateSave();
  updateEditorStats();
  closeAIPanel();
});

btnAiInsert.addEventListener('click', () => {
  const start = noteEditor.selectionStart;
  const end = noteEditor.selectionEnd;
  const val = noteEditor.value;
  
  noteEditor.value = val.substring(0, start) + aiResultCache + val.substring(end);
  noteEditor.selectionStart = noteEditor.selectionEnd = start + aiResultCache.length;
  noteEditor.focus();
  
  triggerStateSave();
  updateEditorStats();
  closeAIPanel();
});

btnAiAppend.addEventListener('click', () => {
  const val = noteEditor.value;
  const spacing = val ? '\n\n' : '';
  noteEditor.value = val + spacing + aiResultCache;
  
  triggerStateSave();
  updateEditorStats();
  closeAIPanel();
});

// Reasoning toggle accordion
btnToggleReasoning.addEventListener('click', () => {
  aiReasoningAccordion.classList.toggle('expanded');
});

// History / Trash recovery tab functions
function getRelativeTime(timestamp) {
  if (!timestamp || isNaN(timestamp)) return 'Unknown time';
  const diff = Date.now() - timestamp;
  if (diff < 60000) return 'Just now';
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins} min${mins > 1 ? 's' : ''} ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  
  const date = new Date(timestamp);
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

async function loadAndRenderTrash() {
  globalConfig = await window.noteAPI.getGlobalConfig();
  const trash = globalConfig.trash || [];
  
  trashListContainer.innerHTML = '';
  
  if (trash.length === 0) {
    trashEmptyState.classList.remove('hidden');
    btnClearTrash.classList.add('hidden');
    return;
  }
  
  trashEmptyState.classList.add('hidden');
  btnClearTrash.classList.remove('hidden');
  
  trash.forEach(note => {
    const trashItem = document.createElement('div');
    const colorClass = note.color ? `color-${note.color}` : 'color-yellow';
    trashItem.className = `trash-item ${colorClass}`;
    
    const textSnippet = note.noteText ? note.noteText.trim() : '';
    const snippetLimit = 60;
    const snippetDisplay = textSnippet.length > snippetLimit 
      ? textSnippet.substring(0, snippetLimit) + '...' 
      : textSnippet || '(Empty note)';
    
    const timeStr = getRelativeTime(note.deletedAt);
    
    trashItem.innerHTML = `
      <div class="trash-item-header">
        <span class="trash-item-time">${timeStr}</span>
      </div>
      <div class="trash-item-snippet"></div>
      <div class="trash-item-actions">
        <button class="btn btn-primary btn-restore" title="Restore note" style="padding: 4px 8px; font-size: 10px; border-radius: 8px;">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 2px; vertical-align: middle;">
            <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/>
          </svg>
          <span>Restore</span>
        </button>
        <button class="btn btn-danger btn-delete-perm" title="Delete permanently" style="padding: 4px 8px; font-size: 10px; border-radius: 8px;">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 2px; vertical-align: middle;">
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
          </svg>
          <span>Delete</span>
        </button>
      </div>
    `;
    
    trashItem.querySelector('.trash-item-snippet').textContent = snippetDisplay;
    
    // Wire Restore
    trashItem.querySelector('.btn-restore').addEventListener('click', async (e) => {
      e.stopPropagation();
      const success = await window.noteAPI.restoreNote(note.id);
      if (success) {
        trackAppEvent('note_restore');
        loadAndRenderTrash();
      } else {
        alert('Failed to restore note.');
      }
    });
    
    // Wire Delete Permanently
    trashItem.querySelector('.btn-delete-perm').addEventListener('click', async (e) => {
      e.stopPropagation();
      if (confirm('Are you sure you want to permanently delete this note? This action cannot be undone.')) {
        globalConfig.trash = globalConfig.trash.filter(n => n.id !== note.id);
        await window.noteAPI.updateGlobalConfig(globalConfig);
        loadAndRenderTrash();
      }
    });
    
    trashListContainer.appendChild(trashItem);
  });
}

// Clear Trash
btnClearTrash.addEventListener('click', async () => {
  if (confirm('Are you sure you want to permanently delete all notes in the trash? This action cannot be undone.')) {
    globalConfig.trash = [];
    await window.noteAPI.updateGlobalConfig(globalConfig);
    trackAppEvent('trash_clear');
    loadAndRenderTrash();
  }
});

// Refresh Trash
btnRefreshTrash.addEventListener('click', () => {
  const svg = btnRefreshTrash.querySelector('svg');
  if (svg) {
    svg.style.transition = 'transform 0.5s ease';
    svg.style.transform = 'rotate(360deg)';
    setTimeout(() => { svg.style.transform = 'none'; }, 500);
  }
  loadAndRenderTrash();
});

/* ==========================================================================
   Live Meeting / Background Media Notes
   ========================================================================== */
async function refreshRecordingSources() {
  if (!window.recordingAPI) {
    recordingSource.innerHTML = '<option value="">Desktop recording is available in the installed app</option>';
    recordingStart.disabled = true;
    return;
  }

  const previous = recordingSource.value;
  recordingSource.innerHTML = '<option value="">Loading sources…</option>';
  try {
    const permissions = await window.recordingAPI.getPermissions();
    recordingPlatform = permissions.platform || '';
    recordingOpenPermissions.classList.toggle('hidden', recordingPlatform !== 'darwin' || permissions.screen === 'granted');
    const sources = await window.recordingAPI.getSources();
    recordingSource.innerHTML = '<option value="">Choose a window or screen…</option>';
    sources
      .sort((a, b) => a.kind.localeCompare(b.kind) || a.name.localeCompare(b.name))
      .forEach(source => {
        const option = document.createElement('option');
        option.value = source.id;
        option.dataset.name = source.name;
        option.textContent = `${source.kind === 'screen' ? 'Screen' : 'Window'} · ${source.name}`;
        recordingSource.appendChild(option);
      });
    if ([...recordingSource.options].some(option => option.value === previous)) recordingSource.value = previous;
  } catch (error) {
    recordingSource.innerHTML = '<option value="">Unable to list capture sources</option>';
    recordingOpenPermissions.classList.toggle('hidden', recordingPlatform !== 'darwin');
    setRecordingStatus('error', error.message || 'Source discovery failed');
  }
}

function setRecordingStatus(state, message) {
  recordingStatus.className = `recording-status ${state}`;
  const label = message || ({ idle: 'Ready', connecting: 'Connecting', recording: 'Recording', paused: 'Paused', error: 'Error' }[state] || state);
  recordingStatus.innerHTML = `<span></span>${escapeHtml(label)}`;
  const active = state === 'recording' || state === 'paused' || state === 'connecting' || (state === 'error' && recordingStreams.length > 0);
  recordingStart.classList.toggle('hidden', active);
  recordingPause.classList.toggle('hidden', !active || state === 'connecting');
  recordingStop.classList.toggle('hidden', !active);
  recordingPause.textContent = state === 'paused' ? 'Resume' : 'Pause';
}

let recordingSegments = []; // [{ speaker, text }] - manual speaker turns (no auto-diarization from the transcription provider)

function recomputeRecordingFinalText() {
  recordingFinalText = recordingSegments
    .filter(seg => seg.text)
    .map(seg => `**${seg.speaker}:** ${seg.text}`)
    .join('\n\n');
}

function renderRecordingTranscript() {
  const partial = recordingPartialText.trim();
  const hasSegments = recordingSegments.some(seg => seg.text);
  if (!hasSegments && !partial) {
    recordingTranscript.innerHTML = '<div class="recording-empty">Listening for speech…</div>';
  } else {
    let html = recordingSegments
      .filter(seg => seg.text)
      .map((seg, idx) => `<div class="transcript-segment"><span class="speaker-badge" contenteditable="true" spellcheck="false" data-speaker="${escapeHtml(seg.speaker)}">${escapeHtml(seg.speaker)}</span><span class="transcript-segment-text">${escapeHtml(seg.text)}</span></div>`)
      .join('');
    if (partial) html += `<div class="recording-partial-line"><span class="recording-partial">${escapeHtml(partial)}</span></div>`;
    recordingTranscript.innerHTML = html;
    recordingTranscript.scrollTop = recordingTranscript.scrollHeight;
  }
  recordingCopy.disabled = !hasSegments;
  recordingInsert.disabled = !hasSegments;
  recordingSendLinear.disabled = !hasSegments;
}

// Renaming a speaker badge renames every segment currently sharing that same label
recordingTranscript.addEventListener('focusout', (e) => {
  const badge = e.target.closest('.speaker-badge');
  if (!badge) return;
  const oldName = badge.dataset.speaker;
  const newName = badge.textContent.trim() || oldName;
  if (newName !== oldName) {
    recordingSegments.forEach(seg => { if (seg.speaker === oldName) seg.speaker = newName; });
    recomputeRecordingFinalText();
  }
  renderRecordingTranscript();
});

const recordingNewSpeaker = document.getElementById('recording-new-speaker');
recordingNewSpeaker.addEventListener('click', () => {
  const usedNames = new Set(recordingSegments.map(seg => seg.speaker));
  let n = 2;
  while (usedNames.has(`Speaker ${n}`)) n += 1;
  recordingSegments.push({ speaker: `Speaker ${n}`, text: '' });
});

function resampleFloat32(floatSamples, sourceRate, targetRate) {
  if (sourceRate === targetRate) return floatSamples;
  const targetLength = Math.max(1, Math.round(floatSamples.length * targetRate / sourceRate));
  const output = new Float32Array(targetLength);
  const ratio = (floatSamples.length - 1) / Math.max(1, targetLength - 1);
  for (let index = 0; index < targetLength; index += 1) {
    const sourceIndex = index * ratio;
    const leftIndex = Math.floor(sourceIndex);
    const rightIndex = Math.min(floatSamples.length - 1, leftIndex + 1);
    const weight = sourceIndex - leftIndex;
    output[index] = floatSamples[leftIndex] * (1 - weight) + floatSamples[rightIndex] * weight;
  }
  return output;
}

function floatToPcm16(floatSamples) {
  const pcm = new Int16Array(floatSamples.length);
  for (let index = 0; index < floatSamples.length; index += 1) {
    const sample = Math.max(-1, Math.min(1, floatSamples[index]));
    pcm[index] = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
  }
  return new Uint8Array(pcm.buffer);
}

async function requestRecordingDisplayStream() {
  const preferredOptions = {
    video: true,
    audio: { suppressLocalAudioPlayback: false },
    systemAudio: 'include',
    windowAudio: 'system',
    surfaceSwitching: 'include',
    monitorTypeSurfaces: 'include',
  };
  try {
    return await navigator.mediaDevices.getDisplayMedia(preferredOptions);
  } catch (error) {
    if (error?.name === 'TypeError') {
      return navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
    }
    throw error;
  }
}

async function openRecordingAudio(includeMicrophone) {
  const displayStream = await requestRecordingDisplayStream();
  const systemTracks = displayStream.getAudioTracks();
  const systemTrackDetails = systemTracks
    .map(track => `${track.label || 'unlabeled'}:${track.readyState}:${track.enabled ? 'enabled' : 'disabled'}`)
    .join(', ') || 'none';
  console.info('[recording] Display audio tracks', { tracks: systemTrackDetails, platform: recordingPlatform, includeMicrophone });
  window.noteAPI?.logMsg?.(`[recording] display audio tracks: ${systemTrackDetails}`);

  // Always retain the display stream so cleanup stops its video permission/capture too.
  recordingStreams = [displayStream];

  if (includeMicrophone) {
    const micStream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      video: false,
    });
    recordingStreams.push(micStream);
  }

  if (systemTracks.length === 0 && !includeMicrophone) {
    displayStream.getTracks().forEach(track => track.stop());
    const message = recordingPlatform === 'darwin'
      ? 'No system audio was shared. In the macOS screen picker, select the YouTube screen/window and enable system audio. Hearing it in headphones is not enough unless macOS shares that audio track with the app.'
      : 'The selected source provided no system audio. Allow Screen & System Audio Recording, restart the app, then select the screen playing the meeting or video.';
    throw new Error(message);
  }

  if (!recordingAudioContext || recordingAudioContext.state === 'closed') {
    recordingAudioContext = new AudioContext({ sampleRate: RECORDING_TARGET_SAMPLE_RATE, latencyHint: 'interactive' });
  }
  if (recordingAudioContext.state === 'suspended') {
    await recordingAudioContext.resume();
  }
  const mix = recordingAudioContext.createGain();
  const audioStreamCount = recordingStreams.filter(stream => stream.getAudioTracks().length > 0).length;
  mix.gain.value = audioStreamCount > 1 ? 0.7 : 1;

  recordingStreams.forEach(stream => {
    if (stream.getAudioTracks().length > 0) {
      recordingAudioContext.createMediaStreamSource(stream).connect(mix);
    }
  });

  recordingProcessor = recordingAudioContext.createScriptProcessor(4096, 1, 1);
  const silentOutput = recordingAudioContext.createGain();
  silentOutput.gain.value = 0;
  mix.connect(recordingProcessor);
  recordingProcessor.connect(silentOutput);
  silentOutput.connect(recordingAudioContext.destination);
  recordingProcessor.onaudioprocess = event => {
    if (recordingIsPaused) return;
    const samples = event.inputBuffer.getChannelData(0);
    let squareSum = 0;
    for (let index = 0; index < samples.length; index += 1) squareSum += samples[index] * samples[index];
    const rms = Math.sqrt(squareSum / Math.max(1, samples.length));
    if (!recordingSignalDetected && rms > 0.0015) {
      recordingSignalDetected = true;
      clearTimeout(recordingSignalTimer);
      recordingSignalTimer = null;
      setRecordingStatus('recording', 'Recording · audio detected');
    }
    recordingAudioFramesSent += 1;
    if (recordingAudioFramesSent === 1 || (recordingAudioFramesSent === 30 && !recordingSignalDetected)) {
      window.noteAPI?.logMsg?.(`[recording] audio frame ${recordingAudioFramesSent}: rms=${rms.toFixed(6)}, sampleRate=${recordingAudioContext.sampleRate}, streams=${audioStreamCount}`);
    }
    const transcriptionSamples = resampleFloat32(samples, recordingAudioContext.sampleRate, RECORDING_TARGET_SAMPLE_RATE);
    window.recordingAPI.sendAudio(floatToPcm16(transcriptionSamples));
  };

  const videoTracks = displayStream.getVideoTracks();
  if (videoTracks.length > 0) {
    videoTracks.forEach(track => {
      track.enabled = false;
      track.addEventListener('ended', () => stopLiveRecording(), { once: true });
    });
  }

  recordingSignalDetected = false;
  clearTimeout(recordingSignalTimer);
  recordingSignalTimer = setTimeout(() => {
    if (!recordingSignalDetected && !recordingIsPaused) {
      setRecordingStatus('recording', 'Recording · no audio signal detected');
      if (!recordingFinalText && !recordingPartialText) {
        const message = recordingPlatform === 'darwin'
          ? 'No audio signal yet. Make sure the macOS picker shared system audio for the YouTube source. Audio playing in headphones is not enough if macOS did not share it with the app.'
          : 'No audio signal yet. Play the video or meeting, check its volume, and confirm Screen & System Audio Recording permission.';
        recordingTranscript.innerHTML = `<div class="recording-empty">${escapeHtml(message)}</div>`;
      }
    }
  }, 6000);
}

async function startLiveRecording() {
  if (!recordingSource.value) {
    setRecordingStatus('error', 'Choose a source first');
    return;
  }

  const selected = recordingSource.selectedOptions[0];
  const request = {
    sourceId: recordingSource.value,
    sourceName: selected.dataset.name || selected.textContent,
    includeMicrophone: recordingMicrophone.checked,
  };

  try {
    setRecordingStatus('connecting');
    // Create AudioContext synchronously during the click handler before any await
    if (!recordingAudioContext || recordingAudioContext.state === 'closed') {
      recordingAudioContext = new AudioContext({ sampleRate: RECORDING_TARGET_SAMPLE_RATE, latencyHint: 'interactive' });
    }
    if (recordingAudioContext.state === 'suspended') {
      recordingAudioContext.resume();
    }

    const permissions = await window.recordingAPI.getPermissions();
    if (permissions.screen === 'denied') {
      throw new Error('Screen & System Audio Recording permission is denied. Enable it in System Settings, then restart myStickynote.');
    }
    if (request.includeMicrophone) {
      const microphoneAllowed = await window.recordingAPI.requestMicrophone();
      if (!microphoneAllowed) throw new Error('Microphone permission was not granted.');
    }
    const session = await window.recordingAPI.start(request);
    await openRecordingAudio(request.includeMicrophone);
    recordingFinalText = '';
    recordingPartialText = '';
    recordingSegments = [];
    recordingSummary.textContent = '';
    recordingSendNotion.disabled = true;
    recordingStartedAt = Date.now();
    recordingIsPaused = false;
    recordingContext.textContent = `${session.metadata.contentTitle} · ${session.metadata.application}`;
    recordingContext.classList.remove('hidden');
    recordingClock = setInterval(updateRecordingClock, 1000);
    renderRecordingTranscript();
    setRecordingStatus('recording');
    trackAppEvent('live_notes_start', { source_type: session.metadata.sourceType, microphone: request.includeMicrophone });
  } catch (error) {
    cleanupRecordingMedia();
    await window.recordingAPI.stop().catch(() => {});
    setRecordingStatus('error', error.message || 'Could not start recording');
  }
}

async function toggleLiveRecordingPause() {
  recordingIsPaused = !recordingIsPaused;
  if (recordingIsPaused) {
    await recordingAudioContext?.suspend();
    await window.recordingAPI.pause();
    setRecordingStatus('paused');
  } else {
    await recordingAudioContext?.resume();
    await window.recordingAPI.resume();
    setRecordingStatus('recording');
  }
}

function cleanupRecordingMedia() {
  clearInterval(recordingClock);
  recordingClock = null;
  clearTimeout(recordingSignalTimer);
  recordingSignalTimer = null;
  recordingSignalDetected = false;
  recordingAudioFramesSent = 0;
  recordingProcessor?.disconnect();
  recordingProcessor = null;
  recordingStreams.forEach(stream => stream.getTracks().forEach(track => track.stop()));
  recordingStreams = [];
  recordingAudioContext?.close().catch(() => {});
  recordingAudioContext = null;
  recordingIsPaused = false;
}

async function stopLiveRecording() {
  if (!window.recordingAPI) return;
  cleanupRecordingMedia();
  await window.recordingAPI.stop().catch(error => console.warn('Recording stop failed', error));
  setRecordingStatus('idle');
  trackAppEvent('live_notes_stop', { duration_sec: Math.round((Date.now() - recordingStartedAt) / 1000) });
}

function updateRecordingClock() {
  const seconds = Math.max(0, Math.floor((Date.now() - recordingStartedAt) / 1000));
  recordingDuration.textContent = `${Math.floor(seconds / 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;
}

recordingStart.addEventListener('click', startLiveRecording);
recordingOpenPermissions.addEventListener('click', async () => {
  await window.recordingAPI.openPermissions();
  setRecordingStatus('error', 'Allow Screen & System Audio Recording, then restart myStickynote');
});
recordingPause.addEventListener('click', toggleLiveRecordingPause);
recordingStop.addEventListener('click', stopLiveRecording);
recordingCopy.addEventListener('click', async () => navigator.clipboard.writeText(recordingFinalText.trim()));
recordingInsert.addEventListener('click', () => {
  const text = recordingFinalText.trim();
  if (!text) return;
  noteEditor.value = `${noteEditor.value}${noteEditor.value ? '\n\n' : ''}${text}`;
  noteEditor.dispatchEvent(new Event('input'));
  switchTab('note');
});

if (window.recordingAPI) {
  window.recordingAPI.onState(({ state, message }) => {
    setRecordingStatus(state, message);
    if (state === 'idle' && recordingStreams.length > 0) cleanupRecordingMedia();
  });
  window.recordingAPI.onTranscript(event => {
    if (event.type === 'partial') recordingPartialText = event.text || '';
    if (event.type === 'final') {
      const finalChunk = (event.text || recordingPartialText).trim();
      if (finalChunk) {
        if (recordingSegments.length === 0) {
          recordingSegments.push({ speaker: 'Speaker 1', text: finalChunk });
        } else {
          const last = recordingSegments[recordingSegments.length - 1];
          last.text = last.text ? `${last.text} ${finalChunk}` : finalChunk;
        }
        recomputeRecordingFinalText();
      }
      recordingPartialText = '';
    }
    if (event.type === 'error') setRecordingStatus('error', event.message);
    if (event.type === 'status' && event.message) {
      setRecordingStatus(recordingIsPaused ? 'paused' : 'recording', event.message);
    }
    if (event.type === 'summary' && event.text) {
      recordingSummary.textContent = event.text;
      recordingSendNotion.disabled = false;
    }
    renderRecordingTranscript();
  });
}

recordingSendNotion.addEventListener('click', async () => {
  const token = settingNotionToken.value.trim();
  const database = settingNotionDatabase.value.trim();
  if (!token || !database) {
    alert('Add your Notion API token and database ID in Settings → Integrations first.');
    switchTab('settings');
    return;
  }
  const summaryText = recordingSummary.textContent.trim();
  if (!summaryText) return;
  recordingSendNotion.disabled = true;
  const result = await window.noteAPI.sendTasksToNotion({ token, database, text: summaryText });
  recordingSendNotion.disabled = false;
  if (result && result.error) alert(`Notion send failed: ${result.error}`);
  else alert('Summary sent to Notion.');
});

recordingSendLinear.addEventListener('click', async () => {
  const token = settingLinearToken.value.trim();
  const team = settingLinearTeam.value.trim();
  if (!token || !team) {
    alert('Add your Linear API key and team ID in Settings → Integrations first.');
    switchTab('settings');
    return;
  }
  const text = recordingFinalText.trim();
  if (!text) return;
  recordingSendLinear.disabled = true;
  const result = await window.noteAPI.sendTasksToLinear({ token, team, text });
  recordingSendLinear.disabled = false;
  if (result && result.error) alert(`Linear send failed: ${result.error}`);
  else alert(`Created ${result?.count || 0} issue(s) in Linear.`);
});

/* ==========================================================================
   Tags
   ========================================================================== */
function renderNoteTags() {
  noteTagsList.innerHTML = '';
  (noteConfig.tags || []).forEach((tag, idx) => {
    const chip = document.createElement('span');
    chip.className = 'note-tag-chip';
    const label = document.createElement('span');
    label.textContent = tag;
    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.className = 'note-tag-remove';
    removeBtn.textContent = '×';
    removeBtn.title = 'Remove tag';
    removeBtn.addEventListener('click', () => {
      noteConfig.tags.splice(idx, 1);
      renderNoteTags();
      triggerStateSave();
    });
    chip.appendChild(label);
    chip.appendChild(removeBtn);
    noteTagsList.appendChild(chip);
  });
}

noteTagInput.addEventListener('keydown', (e) => {
  if (e.key !== 'Enter') return;
  e.preventDefault();
  const val = noteTagInput.value.trim().replace(/,+$/, '');
  if (val) {
    noteConfig.tags = noteConfig.tags || [];
    if (!noteConfig.tags.includes(val)) {
      noteConfig.tags.push(val);
      renderNoteTags();
      triggerStateSave();
    }
  }
  noteTagInput.value = '';
});

/* ==========================================================================
   Markdown-lite preview (checklists, code blocks, bold/italic)
   ========================================================================== */
function renderInlineMarkdown(line) {
  let html = escapeHtml(line);
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  return html;
}

function renderMarkdownLite(raw) {
  const rawLines = raw.split('\n');
  const parts = [];
  let inFence = false;
  let fenceBuffer = [];
  rawLines.forEach((line, idx) => {
    if (/^\s*```/.test(line)) {
      if (!inFence) {
        inFence = true;
        fenceBuffer = [];
      } else {
        inFence = false;
        parts.push(`<pre class="md-code-block"><code>${escapeHtml(fenceBuffer.join('\n'))}</code></pre>`);
      }
      return;
    }
    if (inFence) {
      fenceBuffer.push(line);
      return;
    }
    const checklistMatch = line.match(/^(\s*)-\s\[( |x|X)\]\s?(.*)$/);
    if (checklistMatch) {
      const checked = /x/i.test(checklistMatch[2]);
      parts.push(`<div class="md-checklist-item"><input type="checkbox" class="md-checklist-box" data-line="${idx}" ${checked ? 'checked' : ''}><span>${renderInlineMarkdown(checklistMatch[3])}</span></div>`);
      return;
    }
    parts.push(renderInlineMarkdown(line));
  });
  if (inFence && fenceBuffer.length) {
    parts.push(`<pre class="md-code-block"><code>${escapeHtml(fenceBuffer.join('\n'))}</code></pre>`);
  }
  return parts.join('<br>') || '<span class="recording-empty">Nothing to preview yet.</span>';
}

btnNotePreview.addEventListener('click', () => {
  const currentlyShowingPreview = !notePreview.classList.contains('hidden');
  if (currentlyShowingPreview) {
    notePreview.classList.add('hidden');
    noteEditor.classList.remove('hidden');
    btnNotePreviewLabel.textContent = 'Preview';
  } else {
    notePreview.innerHTML = renderMarkdownLite(noteEditor.value);
    notePreview.classList.remove('hidden');
    noteEditor.classList.add('hidden');
    btnNotePreviewLabel.textContent = 'Edit';
  }
});

noteEditor.addEventListener('input', () => {
  if (!notePreview.classList.contains('hidden')) {
    notePreview.innerHTML = renderMarkdownLite(noteEditor.value);
  }
});

notePreview.addEventListener('click', (e) => {
  const box = e.target.closest('.md-checklist-box');
  if (!box) return;
  const lineIdx = Number(box.dataset.line);
  const lines = noteEditor.value.split('\n');
  const match = lines[lineIdx] ? lines[lineIdx].match(/^(\s*-\s\[)( |x|X)(\].*)$/) : null;
  if (match) {
    lines[lineIdx] = `${match[1]}${box.checked ? 'x' : ' '}${match[3]}`;
    noteEditor.value = lines.join('\n');
    noteEditor.dispatchEvent(new Event('input'));
    notePreview.innerHTML = renderMarkdownLite(noteEditor.value);
  }
});

/* ==========================================================================
   Export (Markdown / Text / PDF)
   ========================================================================== */
btnNoteExport.addEventListener('click', (e) => {
  e.stopPropagation();
  noteExportMenu.classList.toggle('hidden');
});

document.addEventListener('click', (e) => {
  if (!noteExportMenu.contains(e.target) && !btnNoteExport.contains(e.target)) {
    noteExportMenu.classList.add('hidden');
  }
});

noteExportMenu.querySelectorAll('button[data-format]').forEach(btn => {
  btn.addEventListener('click', async () => {
    noteExportMenu.classList.add('hidden');
    const format = btn.dataset.format;
    trackAppEvent('note_export', { format });
    const result = await window.noteAPI.exportNote(noteId, format, noteEditor.value);
    if (result && result.error && result.error !== 'canceled') {
      alert(`Export failed: ${result.error}`);
    }
  });
});

/* ==========================================================================
   Reminders
   ========================================================================== */
function toDatetimeLocalValue(d) {
  const pad = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function renderReminderState() {
  if (noteConfig.remindAt) {
    const d = new Date(noteConfig.remindAt);
    noteRemindActiveLabel.textContent = `Reminder set for ${d.toLocaleString()}`;
    noteRemindActiveLabel.classList.remove('hidden');
    btnNoteRemindClear.classList.remove('hidden');
    noteRemindDatetime.value = toDatetimeLocalValue(d);
  } else {
    noteRemindActiveLabel.classList.add('hidden');
    btnNoteRemindClear.classList.add('hidden');
  }
}

btnNoteRemind.addEventListener('click', (e) => {
  e.stopPropagation();
  noteRemindPopover.classList.toggle('hidden');
});

document.addEventListener('click', (e) => {
  if (!noteRemindPopover.contains(e.target) && !btnNoteRemind.contains(e.target)) {
    noteRemindPopover.classList.add('hidden');
  }
});

btnNoteRemindSet.addEventListener('click', async () => {
  if (!noteRemindDatetime.value) return;
  const timestamp = new Date(noteRemindDatetime.value).getTime();
  if (Number.isNaN(timestamp) || timestamp <= Date.now()) {
    alert('Pick a time in the future.');
    return;
  }
  noteConfig.remindAt = timestamp;
  await window.noteAPI.setReminder(noteId, timestamp, noteEditor.value.slice(0, 120));
  renderReminderState();
  triggerStateSave();
  noteRemindPopover.classList.add('hidden');
  trackAppEvent('note_reminder_set');
});

btnNoteRemindClear.addEventListener('click', async () => {
  noteConfig.remindAt = null;
  await window.noteAPI.setReminder(noteId, null, '');
  renderReminderState();
  triggerStateSave();
  noteRemindPopover.classList.add('hidden');
});

/* ==========================================================================
   Per-note passphrase lock (AES-256-GCM, handled in the main process)
   ========================================================================== */
function showNoteLockOverlay() {
  noteLockOverlay.classList.remove('hidden');
  noteEditor.classList.add('hidden');
  notePreview.classList.add('hidden');
}

function hideNoteLockOverlay() {
  noteLockOverlay.classList.add('hidden');
  noteEditor.classList.remove('hidden');
  noteLockPassphraseInput.value = '';
  noteLockError.classList.add('hidden');
}

btnNoteLock.addEventListener('click', async () => {
  if (noteConfig.locked) return; // interaction happens through the unlock overlay
  const passphrase = prompt('Set a passphrase to lock this note. You will need it to view or edit the note again — there is no recovery if you forget it.');
  if (!passphrase) return;
  const result = await window.noteAPI.lockNote(noteId, passphrase, noteEditor.value);
  if (result && result.error) {
    alert(`Could not lock note: ${result.error}`);
    return;
  }
  Object.assign(noteConfig, result, { locked: true, noteText: '' });
  noteEditor.value = '';
  updateEditorStats();
  showNoteLockOverlay();
  triggerStateSave();
  trackAppEvent('note_locked');
});

btnNoteUnlockSubmit.addEventListener('click', async () => {
  const passphrase = noteLockPassphraseInput.value;
  if (!passphrase) return;
  const result = await window.noteAPI.unlockNote(noteId, passphrase);
  if (result && result.error) {
    noteLockError.textContent = result.error === 'bad-passphrase' ? 'Incorrect passphrase.' : result.error;
    noteLockError.classList.remove('hidden');
    return;
  }
  noteConfig.locked = false;
  noteConfig.lockSalt = null;
  noteConfig.lockIv = null;
  noteConfig.lockAuthTag = null;
  noteConfig.lockCiphertext = null;
  noteEditor.value = result.noteText || '';
  hideNoteLockOverlay();
  updateEditorStats();
  triggerStateSave();
});

noteLockPassphraseInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') btnNoteUnlockSubmit.click();
});

/* ==========================================================================
   Advanced AI providers toggle (BYOK is opt-in, not the default view)
   ========================================================================== */
btnToggleAdvancedAi.addEventListener('click', () => {
  const willShow = aiAdvancedProviders.classList.contains('hidden');
  aiAdvancedProviders.classList.toggle('hidden');
  btnToggleAdvancedAi.classList.toggle('expanded', willShow);
});

/* ==========================================================================
   Notes Library (cross-note search + tags)
   ========================================================================== */
let currentLibraryTag = null;
let librarySearchTimeout = null;

function renderLibraryTagFilters(tags) {
  libraryTagFilters.innerHTML = '';
  tags.forEach(tag => {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = `library-tag-filter-chip${currentLibraryTag === tag ? ' active' : ''}`;
    chip.textContent = tag;
    chip.addEventListener('click', () => {
      currentLibraryTag = currentLibraryTag === tag ? null : tag;
      loadNotesLibrary();
    });
    libraryTagFilters.appendChild(chip);
  });
}

async function loadNotesLibrary() {
  if (!window.noteAPI.listAllNotes) return;
  const query = librarySearch.value.trim();
  const results = await window.noteAPI.listAllNotes({ query, tag: currentLibraryTag });
  renderLibraryTagFilters(results.allTags || []);
  libraryList.innerHTML = '';
  if (!results.notes || results.notes.length === 0) {
    libraryEmptyState.classList.remove('hidden');
    return;
  }
  libraryEmptyState.classList.add('hidden');
  results.notes.forEach(n => {
    const item = document.createElement('div');
    item.className = 'library-item';
    const snippet = (n.noteText || '').slice(0, 140).replace(/\n/g, ' ');
    const tagsHtml = (n.tags || []).map(t => `<span class="library-item-tag">${escapeHtml(t)}</span>`).join('');
    item.innerHTML = `<div class="library-item-dot theme-${escapeHtml(n.color || 'yellow')}"></div><div class="library-item-body"><div class="library-item-snippet">${snippet ? escapeHtml(snippet) : '<em>Empty note</em>'}${n.locked ? ' 🔒' : ''}</div><div class="library-item-tags">${tagsHtml}</div></div>`;
    item.addEventListener('click', () => window.noteAPI.openNote(n.id));
    libraryList.appendChild(item);
  });
}

librarySearch.addEventListener('input', () => {
  clearTimeout(librarySearchTimeout);
  librarySearchTimeout = setTimeout(loadNotesLibrary, 200);
});

/* ==========================================================================
   Account & Cloud Sync (Supabase-backed, optional)
   ========================================================================== */
async function refreshAccountUI() {
  if (!window.noteAPI.getAccountSession) return;
  const session = await window.noteAPI.getAccountSession();
  if (session && session.email) {
    accountSignedOut.classList.add('hidden');
    accountSignedIn.classList.remove('hidden');
    accountEmailLabel.textContent = session.email;
    accountSyncStatus.textContent = session.lastSyncedAt ? `Last synced ${getRelativeTime(session.lastSyncedAt)}` : 'Not synced yet';
  } else {
    accountSignedOut.classList.remove('hidden');
    accountSignedIn.classList.add('hidden');
  }
}

btnAccountSignup.addEventListener('click', async () => {
  accountError.classList.add('hidden');
  const email = accountEmailInput.value.trim();
  const password = accountPasswordInput.value;
  if (!email || !password) return;
  btnAccountSignup.disabled = true;
  const result = await window.noteAPI.accountSignUp(email, password);
  btnAccountSignup.disabled = false;
  if (result && result.error) {
    accountError.textContent = result.error;
    accountError.classList.remove('hidden');
    return;
  }
  refreshAccountUI();
});

btnAccountSignin.addEventListener('click', async () => {
  accountError.classList.add('hidden');
  const email = accountEmailInput.value.trim();
  const password = accountPasswordInput.value;
  if (!email || !password) return;
  btnAccountSignin.disabled = true;
  const result = await window.noteAPI.accountSignIn(email, password);
  btnAccountSignin.disabled = false;
  if (result && result.error) {
    accountError.textContent = result.error;
    accountError.classList.remove('hidden');
    return;
  }
  refreshAccountUI();
});

btnAccountSignout.addEventListener('click', async () => {
  await window.noteAPI.accountSignOut();
  refreshAccountUI();
});

btnAccountSyncNow.addEventListener('click', async () => {
  btnAccountSyncNow.disabled = true;
  accountSyncStatus.textContent = 'Syncing…';
  const result = await window.noteAPI.accountSyncNow();
  btnAccountSyncNow.disabled = false;
  accountSyncStatus.textContent = (result && result.error) ? `Sync failed: ${result.error}` : `Last synced ${getRelativeTime(Date.now())}`;
});

// Initialize application on load
window.addEventListener('DOMContentLoaded', init);

/* ==========================================================================
   Google Analytics 4 (GA4) Tracking Integration (Electron file:// friendly)
   ========================================================================== */
function trackAppEvent(eventName, params = {}) {
  try {
    if (window.noteAPI && window.noteAPI.trackEvent) {
      window.noteAPI.trackEvent(eventName, params).catch(() => {});
    }
  } catch (err) {
    // Ignore errors
  }
}
