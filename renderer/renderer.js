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

// State variables
const noteId = window.noteAPI.getNoteId();
let noteConfig = {};
let saveTimeout = null;
let globalConfig = null;

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
  document.body.className = `theme-${noteConfig.color || 'yellow'}`;
  if (noteConfig.collapsed) {
    document.body.classList.add('collapsed-note');
  }
  
  // Set active checkmark on dot
  const dots = document.querySelectorAll('.color-dot');
  dots.forEach(dot => {
    if (dot.dataset.color === noteConfig.color) {
      dot.classList.add('active');
    } else {
      dot.classList.remove('active');
    }
  });

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
}

// Debounce save function to reduce filesystem write load
function triggerStateSave() {
  if (saveTimeout) clearTimeout(saveTimeout);
  saveTimeout = setTimeout(() => {
    noteConfig.noteText = noteEditor.value;
    window.noteAPI.updateNoteConfig(noteId, {
      noteText: noteConfig.noteText,
      color: noteConfig.color,
      tab: noteConfig.tab,
      alarmTime: noteConfig.alarmTime,
      opacity: noteConfig.opacity,
      fontSize: noteConfig.fontSize,
      autoDim: noteConfig.autoDim,
      dimOpacity: noteConfig.dimOpacity
    });
  }, 400);
}

/* ==========================================================================
   Window / Header events
   ========================================================================== */
// Create New Note
btnNew.addEventListener('click', () => {
  trackAppEvent('note_create');
  window.noteAPI.createNewNote();
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
const colorDots = document.querySelectorAll('.color-dot');
colorDots.forEach(dot => {
  dot.addEventListener('click', (e) => {
    if (window.noteAPI && window.noteAPI.logMsg) {
      window.noteAPI.logMsg(`Color dot clicked. Dataset color: ${dot.dataset.color}`);
    }
    colorDots.forEach(d => d.classList.remove('active'));
    dot.classList.add('active');
    
    const chosenColor = dot.dataset.color;
    noteConfig.color = chosenColor;
    
    // Log class application
    if (window.noteAPI && window.noteAPI.logMsg) {
      window.noteAPI.logMsg(`Applying theme class: theme-${chosenColor}`);
    }
    document.body.className = `theme-${chosenColor}`;
    colorPalette.classList.add('hidden');
    
    trackAppEvent('theme_change', { color: chosenColor });
    triggerStateSave();
  });
});

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

  noteConfig.tab = tabName;
  triggerStateSave();
}

navItems.forEach(item => {
  item.addEventListener('click', () => {
    switchTab(item.dataset.tab);
  });
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
    
    showAIView('result');
  } catch (err) {
    console.error('AI Generation Failed:', err);
    alert(`AI request failed: ${err.message}`);
    showAIView('menu');
  }
}

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
