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
const alarmTimeInput = document.getElementById('alarm-time-input');
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

// State variables
const noteId = window.noteAPI.getNoteId();
let noteConfig = {};
let saveTimeout = null;

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

  // Apply visual theme
  document.body.className = `theme-${noteConfig.color || 'yellow'}`;
  
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
  window.noteAPI.createNewNote();
});

// Delete Current Note
btnDelete.addEventListener('click', () => {
  if (confirm('Are you sure you want to delete this sticky note?')) {
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
  window.noteAPI.toggleAlwaysOnTop(noteId, isPinned);
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
    
    triggerStateSave();
  });
});

// Auto-save on note edit
noteEditor.addEventListener('input', triggerStateSave);

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
  const alarmVal = alarmTimeInput.value;
  if (!alarmVal) return;
  setAlarm(alarmVal);
});

alarmBtnCancel.addEventListener('click', cancelAlarm);

// Initialize application on load
window.addEventListener('DOMContentLoaded', init);
