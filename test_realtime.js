const WebSocket = require('ws');

const url = 'wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-10-01';
const headers = {
    Authorization: `Bearer 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`,
    "OpenAI-Beta": "realtime=v1"
};

const ws = new WebSocket(url, { headers });

ws.on('open', () => {
    console.log('[TEST] Connected to OpenAI');
    
    ws.send(JSON.stringify({
        type: "session.update",
        session: {
            input_audio_format: "pcm16",
            turn_detection: null,
            input_audio_transcription: { model: "whisper-1" },
        }
    }));
    console.log('[TEST] Sent session.update');

    // Create 1 second of dummy silent PCM audio (24000 Hz, 16-bit, mono)
    const audioData = Buffer.alloc(24000 * 2); 
    const base64Audio = audioData.toString('base64');

    ws.send(JSON.stringify({
        type: "input_audio_buffer.append",
        audio: base64Audio
    }));
    console.log('[TEST] Sent dummy audio');

    ws.send(JSON.stringify({
        type: "input_audio_buffer.commit"
    }));
    console.log('[TEST] Sent input_audio_buffer.commit');

    // Wait 5 seconds to see if transcript event fires, then exit
    setTimeout(() => {
        console.log('[TEST] Timeout reached, closing.');
        ws.close();
    }, 5000);
});

ws.on('message', (data) => {
    const msg = JSON.parse(data.toString());
    console.log('[TEST] Received message type:', msg.type);
    if (msg.type === 'error') {
        console.log('       ERROR:', JSON.stringify(msg.error));
    }
});

ws.on('error', (err) => {
    console.log('[TEST] WS Error:', err.message);
});

ws.on('close', (code, reason) => {
    console.log('[TEST] Closed:', code, reason.toString());
});
