const { _electron: electron } = require('playwright');
const path = require('path');
const fs = require('fs');
const os = require('os');

// Paths
const appDir = __dirname;
const userDataDir = path.join(os.homedir(), 'Library', 'Application Support', 'Electron');
const configPath = path.join(userDataDir, 'sticky-notes.json');
const backupPath = path.join(userDataDir, 'sticky-notes.backup.json');
const artifactsDir = '/Users/prince10z/.gemini/antigravity-ide/brain/d227a837-052f-4d16-b8c2-ae8cf7ea256d';

// Delay helper
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

async function runTests() {
  console.log('--- STARTING MYSTICKYNOTE E2E TESTS ---');

  // 1. Back up existing configuration if it exists
  let hasBackup = false;
  if (fs.existsSync(configPath)) {
    console.log('Backing up existing sticky-notes.json...');
    fs.copyFileSync(configPath, backupPath);
    hasBackup = true;
  } else {
    // Ensure directories exist
    fs.mkdirSync(userDataDir, { recursive: true });
  }

  // Create clean initial config for predictable testing
  const initialConfig = {
    notes: [
      {
        id: 'note-test-default',
        x: 100,
        y: 100,
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
      }
    ],
    global: {
      activeProvider: 'gemini',
      providers: {
        gemini: { apiKey: '', model: 'gemini-2.5-flash' },
        openai: { apiKey: '', model: 'gpt-4o-mini' },
        deepseek: { apiKey: '', model: 'deepseek-chat' }
      },
      trash: []
    }
  };
  fs.writeFileSync(configPath, JSON.stringify(initialConfig, null, 2), 'utf8');

  let electronApp;
  try {
    // Launch Electron application
    console.log('Launching Electron application...');
    electronApp = await electron.launch({
      args: [path.join(appDir, 'main.js')]
    });

    // Get the first window
    console.log('Waiting for first window...');
    const window = await electronApp.firstWindow();
    await window.waitForLoadState('domcontentloaded');
    console.log('First window loaded.');

    // Get the actual userData path from Electron main process
    const actualUserDataDir = await electronApp.evaluate(({ app }) => app.getPath('userData'));
    console.log(`[MAIN PROCESS INFO] Electron actual userData path: "${actualUserDataDir}"`);

    // Enable dialog auto-accept
    window.on('dialog', async dialog => {
      console.log(`[DIALOG LOG] Dialog shown: "${dialog.message()}". Accepting.`);
      await dialog.accept();
    });

    // 2. Test Editor tab
    console.log('\n--- TESTING EDITOR PANEL ---');
    
    // Type in editor
    console.log('Typing in editor...');
    await window.fill('textarea#note-editor', 'Hello Antigravity Sticky Note!');
    await delay(500); // Wait for input event / stats update
    
    const statsText = await window.textContent('#editor-stats');
    console.log(`Editor stats: "${statsText}"`);
    if (statsText.includes('30 chars') && statsText.includes('4 words')) {
      console.log('✅ Stats count is correct!');
    } else {
      console.log(`❌ Stats count mismatch. Expected "30 chars | 4 words", got "${statsText}"`);
    }

    // Toggle pin (always-on-top)
    console.log('Toggling Always on Top pin...');
    await window.click('#btn-pin');
    const isPinnedActive = await window.evaluate(() => document.getElementById('btn-pin').classList.contains('active-pin'));
    console.log(`Pin active style: ${isPinnedActive}`);
    if (isPinnedActive) {
      console.log('✅ Pin toggle visual state is correct!');
    } else {
      console.log('❌ Pin toggle failed.');
    }

    // Change color theme to green
    console.log('Opening color palette and selecting green theme...');
    await window.click('#btn-color');
    await delay(200);
    await window.click('.color-dot.green');
    await delay(500); // Wait for class transition
    
    const bodyClass = await window.evaluate(() => document.body.className);
    console.log(`Body theme class name: "${bodyClass}"`);
    if (bodyClass.includes('theme-green')) {
      console.log('✅ Color theme change is correct!');
    } else {
      console.log(`❌ Color theme change failed. Body class: "${bodyClass}"`);
    }

    // Capture editor screenshot
    await window.screenshot({ path: path.join(artifactsDir, 'step1_editor.png') });
    console.log('Captured step1_editor.png');

    // 3. Test Timer tab
    console.log('\n--- TESTING TIMER PANEL ---');
    console.log('Switching to Timer tab...');
    await window.click('.nav-item[data-tab="timer"]');
    await window.waitForSelector('#panel-timer.active');
    console.log('Timer tab active.');

    // Input minutes/seconds
    console.log('Setting timer to 00:03...');
    await window.fill('#timer-min', '00');
    await window.fill('#timer-sec', '03');
    
    // Start timer
    console.log('Starting timer...');
    await window.click('#timer-btn-start');
    await delay(1000);
    
    let timerLabelText = await window.textContent('#timer-label');
    console.log(`Timer after 1s: "${timerLabelText}"`);
    
    // Take screenshot of running timer
    await window.screenshot({ path: path.join(artifactsDir, 'step2_timer.png') });
    console.log('Captured step2_timer.png');

    // Wait for timer to finish and show alert overlay
    console.log('Waiting for timer to expire...');
    await window.waitForSelector('#alert-overlay:not(.hidden)', { timeout: 5000 });
    const alertTitleText = await window.textContent('#alert-title');
    console.log(`Alert shown: "${alertTitleText}"`);
    if (alertTitleText === "Timer's Up!") {
      console.log('✅ Timer alert overlay triggered correctly!');
    } else {
      console.log(`❌ Timer alert title incorrect: "${alertTitleText}"`);
    }

    // Dismiss alert overlay
    console.log('Dismissing alert overlay...');
    await window.click('#alert-btn-dismiss');
    await delay(300);
    
    const isAlertHidden = await window.evaluate(() => document.getElementById('alert-overlay').classList.contains('hidden'));
    console.log(`Alert hidden: ${isAlertHidden}`);
    if (isAlertHidden) {
      console.log('✅ Alert overlay dismissed correctly!');
    } else {
      console.log('❌ Alert overlay dismissal failed.');
    }

    // 4. Test Alarm tab
    console.log('\n--- TESTING ALARM PANEL ---');
    console.log('Switching to Alarm tab...');
    await window.click('.nav-item[data-tab="alarm"]');
    await window.waitForSelector('#panel-alarm.active');
    console.log('Alarm tab active.');

    // Test custom Hour Dropdown Grid
    console.log('Opening Custom Hour Dropdown...');
    await window.click('#btn-hour-trigger');
    await delay(200);
    const isHourMenuVisible = await window.evaluate(() => !document.getElementById('menu-hour').classList.contains('hidden'));
    console.log(`Hour menu dropdown visible: ${isHourMenuVisible}`);
    
    // Select Hour 11
    console.log('Selecting Hour 11...');
    await window.click('#menu-hour .dropdown-item:text("11")');
    await delay(200);
    const hourVal = await window.textContent('#btn-hour-trigger');
    console.log(`Hour trigger value selected: "${hourVal}"`);

    // Test custom Minute Dropdown Grid
    console.log('Opening Custom Minute Dropdown...');
    await window.click('#btn-minute-trigger');
    await delay(200);
    const isMinuteMenuVisible = await window.evaluate(() => !document.getElementById('menu-minute').classList.contains('hidden'));
    console.log(`Minute menu dropdown visible: ${isMinuteMenuVisible}`);
    
    // Select Minute 30
    console.log('Selecting Minute 30...');
    await window.click('#menu-minute .dropdown-item:text("30")');
    await delay(200);
    const minuteVal = await window.textContent('#btn-minute-trigger');
    console.log(`Minute trigger value selected: "${minuteVal}"`);

    // Set Alarm
    console.log('Setting Alarm...');
    await window.click('#alarm-btn-set');
    await delay(500);

    const isAlarmCardVisible = await window.evaluate(() => !document.getElementById('alarm-status-card').classList.contains('hidden'));
    const alarmTimeText = await window.textContent('#active-alarm-time');
    console.log(`Alarm status card visible: ${isAlarmCardVisible}, time: "${alarmTimeText}"`);
    if (isAlarmCardVisible && alarmTimeText.includes('11:30')) {
      console.log('✅ Custom grid alarm successfully set!');
    } else {
      console.log(`❌ Alarm set failed. Visible: ${isAlarmCardVisible}, Text: "${alarmTimeText}"`);
    }

    // Capture Alarm card screenshot
    await window.screenshot({ path: path.join(artifactsDir, 'step3_alarm.png') });
    console.log('Captured step3_alarm.png');

    // Cancel Alarm
    console.log('Canceling Alarm...');
    await window.click('#alarm-btn-cancel');
    await delay(300);
    const isAlarmCardHiddenNow = await window.evaluate(() => document.getElementById('alarm-status-card').classList.contains('hidden'));
    console.log(`Alarm status card hidden after cancel: ${isAlarmCardHiddenNow}`);
    if (isAlarmCardHiddenNow) {
      console.log('✅ Alarm cancellation verified!');
    } else {
      console.log('❌ Alarm cancellation failed.');
    }

    // 5. Test Stopwatch tab
    console.log('\n--- TESTING STOPWATCH PANEL ---');
    console.log('Switching to Stopwatch tab...');
    await window.click('.nav-item[data-tab="stopwatch"]');
    await window.waitForSelector('#panel-stopwatch.active');
    console.log('Stopwatch tab active.');

    // Start
    console.log('Starting stopwatch...');
    await window.click('#sw-btn-start');
    await delay(800);
    
    // Lap 1
    console.log('Recording Lap 1...');
    await window.click('#sw-btn-lap');
    await delay(600);
    
    // Lap 2
    console.log('Recording Lap 2...');
    await window.click('#sw-btn-lap');
    
    // Verify laps count
    const lapItemsCount = await window.evaluate(() => document.querySelectorAll('#sw-laps-list li').length);
    console.log(`Laps list item count: ${lapItemsCount}`);
    if (lapItemsCount === 2) {
      console.log('✅ Stopwatch laps recorded correctly!');
    } else {
      console.log(`❌ Stopwatch laps mismatch. Expected 2, got ${lapItemsCount}`);
    }

    // Capture stopwatch screenshot
    await window.screenshot({ path: path.join(artifactsDir, 'step4_stopwatch.png') });
    console.log('Captured step4_stopwatch.png');

    // Pause and Reset
    console.log('Pausing and resetting stopwatch...');
    await window.click('#sw-btn-pause');
    await delay(200);
    await window.click('#sw-btn-reset');
    await delay(200);
    
    const mainTimeVal = await window.textContent('#sw-main');
    const lapCountAfterReset = await window.evaluate(() => document.querySelectorAll('#sw-laps-list li').length);
    console.log(`Time: "${mainTimeVal}", Laps count: ${lapCountAfterReset}`);
    if (mainTimeVal === '00:00' && lapCountAfterReset === 0) {
      console.log('✅ Stopwatch reset successfully!');
    } else {
      console.log('❌ Stopwatch reset failed.');
    }

    // 6. Test Settings Tab
    console.log('\n--- TESTING SETTINGS PANEL ---');
    console.log('Switching to Settings tab...');
    await window.click('.nav-item[data-tab="settings"]');
    await window.waitForSelector('#panel-settings.active');
    console.log('Settings tab active.');

    // Change Font Size to Medium
    console.log('Selecting Medium font size...');
    await window.click('.font-btn[data-size="16px"]');
    await delay(300);
    
    // Switch to Note and verify font size changed
    console.log('Verifying font size change in note editor...');
    await window.click('.nav-item[data-tab="note"]');
    await window.waitForSelector('#panel-note.active');
    const editorFontSize = await window.evaluate(() => window.getComputedStyle(document.getElementById('note-editor')).fontSize);
    console.log(`Note editor font-size: "${editorFontSize}"`);
    if (editorFontSize === '16px') {
      console.log('✅ Font size setting applied successfully!');
    } else {
      console.log(`❌ Font size setting failed. Got: "${editorFontSize}"`);
    }

    // Take settings screenshot
    await window.click('.nav-item[data-tab="settings"]');
    await window.waitForSelector('#panel-settings.active');
    await window.screenshot({ path: path.join(artifactsDir, 'step5_settings.png') });
    console.log('Captured step5_settings.png');

    // 7. Test History / Trash tab (Empty vs Text Filter)
    console.log('\n--- TESTING DELETED HISTORY ---');
    
    // Navigate to note tab and clear text
    await window.click('.nav-item[data-tab="note"]');
    await window.waitForSelector('#panel-note.active');
    await window.fill('textarea#note-editor', '');
    await delay(1000); // Wait for auto-save

    // Create a new note window (second note)
    console.log('Creating a second note (empty)...');
    
    // We listen for the new window event in Playwright
    const newWindowPromise = electronApp.waitForEvent('window');
    await window.click('#btn-new');
    const window2 = await newWindowPromise;
    await window2.waitForLoadState('domcontentloaded');
    console.log('Second window loaded.');

    // Set dialog handler for second window
    window2.on('dialog', async dialog => {
      console.log(`[DIALOG LOG] Window 2 Dialog shown: "${dialog.message()}". Accepting.`);
      await dialog.accept();
    });

    // Delete the empty second note
    console.log('Deleting empty second note...');
    await window2.click('#btn-delete');
    await delay(800); // Wait for deletion and window close
    
    // Now verify the history is empty
    console.log('Switching Window 1 to History tab to verify empty note is NOT saved...');
    await window.click('.nav-item[data-tab="history"]');
    await window.waitForSelector('#panel-history.active');
    await delay(500);

    let trashItemsCount = await window.evaluate(() => document.querySelectorAll('#trash-list-container .trash-item').length);
    console.log(`Trash list length (expected 0): ${trashItemsCount}`);
    if (trashItemsCount === 0) {
      console.log('✅ Empty note filtered out from History successfully!');
    } else {
      console.log(`❌ Empty note saved to History! Trash count: ${trashItemsCount}`);
    }

    // Now write some text in note 1 and delete it to check text notes are saved
    console.log('Switching Window 1 to Note tab, writing text to be deleted...');
    await window.click('.nav-item[data-tab="note"]');
    await window.waitForSelector('#panel-note.active');
    await window.fill('textarea#note-editor', 'Delete Me Note Content');
    await delay(1000); // Wait for auto-save

    // Create a third note window, type text, and delete it
    console.log('Creating a third note (with text)...');
    const newWindowPromise3 = electronApp.waitForEvent('window');
    await window.click('#btn-new');
    const window3 = await newWindowPromise3;
    await window3.waitForLoadState('domcontentloaded');
    
    window3.on('dialog', async dialog => {
      console.log(`[DIALOG LOG] Window 3 Dialog: "${dialog.message()}". Accepting.`);
      await dialog.accept();
    });
    
    await window3.fill('textarea#note-editor', 'Third Note Content To Trash');
    await delay(1000); // auto-save
    await window3.click('#btn-delete');
    await delay(800);

    // Switch Window 1 to History tab and check trash
    console.log('Verifying deleted text note is saved in History...');
    await window.click('.nav-item[data-tab="history"]');
    await window.waitForSelector('#panel-history.active');
    await delay(500);

    trashItemsCount = await window.evaluate(() => document.querySelectorAll('#trash-list-container .trash-item').length);
    console.log(`Trash list length (expected 1): ${trashItemsCount}`);
    
    let snippetText = await window.textContent('#trash-list-container .trash-item-snippet');
    console.log(`Trash snippet found: "${snippetText}"`);
    
    if (trashItemsCount === 1 && snippetText.includes('Third Note Content')) {
      console.log('✅ Deleted note with text saved to History correctly!');
    } else {
      console.log(`❌ Deleted note verification failed. Count: ${trashItemsCount}, Snippet: "${snippetText}"`);
    }

    // Restore note from Trash
    console.log('Restoring note from History...');
    const restorePromise = electronApp.waitForEvent('window');
    await window.click('#trash-list-container .btn-restore');
    const restoredWindow = await restorePromise;
    await restoredWindow.waitForLoadState('domcontentloaded');
    console.log('Restored window loaded.');

    // Verify restored content
    const restoredText = await restoredWindow.inputValue('textarea#note-editor');
    console.log(`Restored note text content: "${restoredText}"`);
    if (restoredText === 'Third Note Content To Trash') {
      console.log('✅ Note restored with correct content!');
    } else {
      console.log(`❌ Restored note content mismatch: "${restoredText}"`);
    }

    // Clean up restored window
    restoredWindow.on('dialog', async dialog => { await dialog.accept(); });
    await restoredWindow.click('#btn-delete');
    await delay(500);

    // Take screenshot of History
    await window.screenshot({ path: path.join(artifactsDir, 'step6_history.png') });
    console.log('Captured step6_history.png');

    // 8. Test Window Collapse & Hover-to-Reveal
    console.log('\n--- TESTING COLLAPSE & HOVER TRANSITIONS ---');
    await window.click('.nav-item[data-tab="note"]');
    await window.waitForSelector('#panel-note.active');
    await delay(500);

    // Trigger collapse
    console.log('Triggering collapse via button click...');
    await window.click('#btn-collapse');
    await delay(800); // Wait for transition bounds resize

    let winBounds = await window.evaluate(() => ({
      width: window.outerWidth,
      height: window.outerHeight
    }));
    console.log(`Collapsed window dimensions: ${winBounds.width}x${winBounds.height}`);
    if (winBounds.height <= 60) {
      console.log('✅ Window successfully collapsed (height <= 60px)!');
    } else {
      console.log(`❌ Window collapse failed. Height: ${winBounds.height}`);
    }

    // Capture collapsed screenshot
    await window.screenshot({ path: path.join(artifactsDir, 'step7_collapsed.png') });
    console.log('Captured step7_collapsed.png');

    // Trigger hover reveal
    console.log('Moving mouse out first...');
    await window.mouse.move(-50, -50);
    await delay(300);

    console.log('Hovering mouse over drag-header to trigger reveal...');
    await window.hover('header.drag-header');
    await delay(800); // Wait for debounce (120ms) and resize animation

    winBounds = await window.evaluate(() => ({
      width: window.outerWidth,
      height: window.outerHeight
    }));
    console.log(`Hover-revealed window height: ${winBounds.height}px`);
    if (winBounds.height > 350) {
      console.log('✅ Hover reveal expanded window successfully!');
    } else {
      console.log(`❌ Hover reveal failed. Height: ${winBounds.height}`);
    }

    // Move mouse away to trigger collapse back
    console.log('Moving mouse away to neutral position...');
    // We hover on coordinates 0,0 of the main window or offscreen
    await window.mouse.move(-50, -50);
    await delay(1200); // Wait for leave buffer (220ms) and collapse animation

    winBounds = await window.evaluate(() => ({
      width: window.outerWidth,
      height: window.outerHeight
    }));
    console.log(`Window height after moving mouse away: ${winBounds.height}px`);
    if (winBounds.height <= 60) {
      console.log('✅ Window collapsed back to 44px successfully!');
    } else {
      console.log(`❌ Collapse back failed. Height: ${winBounds.height}`);
    }

    // Toggle collapse button again to restore permanently
    console.log('Restoring window permanently by clicking collapse again...');
    await window.click('#btn-collapse');
    await delay(800);

    winBounds = await window.evaluate(() => ({
      width: window.outerWidth,
      height: window.outerHeight
    }));
    console.log(`Permanently restored window height: ${winBounds.height}px`);
    if (winBounds.height > 350) {
      console.log('✅ Window restored permanently!');
    } else {
      console.log(`❌ Restore permanently failed. Height: ${winBounds.height}`);
    }

  } catch (err) {
    console.error('Test Execution Error:', err);
  } finally {
    if (electronApp) {
      console.log('Closing Electron application...');
      await electronApp.close();
    }

    // Restore original configuration if we backed it up
    if (hasBackup) {
      console.log('Restoring original sticky-notes.json configuration...');
      try {
        fs.copyFileSync(backupPath, configPath);
        fs.unlinkSync(backupPath);
        console.log('Restore completed successfully.');
      } catch (err) {
        console.error('Failed to restore original configuration:', err);
      }
    } else {
      // Clean up test config
      if (fs.existsSync(configPath)) {
        fs.unlinkSync(configPath);
      }
    }
  }

  console.log('--- TEST RUN COMPLETED ---');
}

runTests();
