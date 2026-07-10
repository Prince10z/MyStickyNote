const { _electron: electron } = require('playwright');
const path = require('path');
const fs = require('fs');
const os = require('os');

const appDir = __dirname;
const userDataDir = path.join(os.homedir(), 'Library', 'Application Support', 'Electron');
const configPath = path.join(userDataDir, 'sticky-notes.json');
const backupPath = path.join(userDataDir, 'sticky-notes.backup.json');

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

async function runTests() {
  console.log('--- STARTING AUDIO RECORDING TESTS ---');

  let hasBackup = false;
  if (fs.existsSync(configPath)) {
    fs.copyFileSync(configPath, backupPath);
    hasBackup = true;
  } else {
    fs.mkdirSync(userDataDir, { recursive: true });
  }

  const initialConfig = {
    notes: [{
        id: 'note-test-recording',
        x: 100, y: 100, width: 600, height: 600,
        alwaysOnTop: false, color: 'yellow', noteText: '',
        tab: 'recording'
    }],
    global: {
      activeProvider: 'gemini',
      providers: { gemini: { apiKey: 'test', model: 'gemini-2.5-flash' } },
      transcription: { gatewayUrl: 'ws://127.0.0.1:8787/v1/live-transcription', token: 'dev-token' }
    }
  };
  fs.writeFileSync(configPath, JSON.stringify(initialConfig, null, 2), 'utf8');

  let electronApp;
  try {
    console.log('Launching Electron application with fake device streams...');
    electronApp = await electron.launch({
      args: [path.join(appDir, 'main.js'), '--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream']
    });

    const window = await electronApp.firstWindow();
    await window.waitForLoadState('domcontentloaded');
    console.log('Window loaded.');

    window.on('dialog', async dialog => {
      console.log(`[DIALOG LOG] Dialog shown: "${dialog.message()}". Accepting.`);
      await dialog.accept();
    });

    // Go to recording tab
    console.log('Switching to Recording tab...');
    await window.click('.nav-item[data-tab="recording"]');
    await window.waitForSelector('#panel-recording.active');

    console.log('Waiting for recording sources to populate...');
    await delay(1000);
    const optionsCount = await window.locator('#recording-source option').count();
    console.log(`Found ${optionsCount} recording sources.`);
    
    // Select the second option (index 1) since index 0 is usually the "Choose a window or screen..." placeholder
    if (optionsCount > 1) {
      await window.selectOption('#recording-source', { index: 1 });
    }

    // Check Microphone
    console.log('Selecting Microphone...');
    await window.check('#recording-microphone');
    await delay(500);

    // Start Recording
    console.log('Starting Recording...');
    await window.click('#recording-start');
    await delay(1000);

    let status = await window.textContent('#recording-status');
    console.log(`Status after start: ${status.trim()}`);

    // Wait a bit for mock gateway to stream initial message
    console.log('Waiting 3 seconds for initial transcripts...');
    await delay(3000);
    let transcriptText = await window.textContent('#recording-transcript');
    console.log(`Transcript after 3s:\n${transcriptText.trim()}`);

    // Pause recording
    console.log('Pausing Recording...');
    await window.click('#recording-pause');
    await delay(1000);
    status = await window.textContent('#recording-status');
    console.log(`Status after pause: ${status.trim()}`);

    // Resume recording
    console.log('Resuming Recording...');
    await window.click('#recording-pause');
    await delay(1000);

    // Wait for the mock gateway to finish sending chunks and summarize
    console.log('Waiting 5 seconds for summaries from mock gateway...');
    await delay(5000);
    
    let summaryText = await window.textContent('#recording-summary');
    console.log(`Summary:\n${summaryText.trim()}`);

    // Stop recording
    console.log('Stopping Recording...');
    await window.click('#recording-stop');
    await delay(1000);

    status = await window.textContent('#recording-status');
    console.log(`Status after stop: ${status.trim()}`);

  } catch (err) {
    console.error('Test Execution Error:', err);
  } finally {
    if (electronApp) await electronApp.close();
    if (hasBackup) {
      fs.copyFileSync(backupPath, configPath);
      fs.unlinkSync(backupPath);
    } else if (fs.existsSync(configPath)) {
      fs.unlinkSync(configPath);
    }
  }
  console.log('--- TEST RUN COMPLETED ---');
}
runTests();
