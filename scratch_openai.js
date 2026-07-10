const WebSocket = require('ws');
const url = 'wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-10-01';
const headers = {
    Authorization: `Bearer sk-proj-invalidkey1234567890`,
    "OpenAI-Beta": "realtime=v1"
};

const ws = new WebSocket(url, { headers });

ws.on('open', () => {
    console.log('Connected!');
    ws.send(JSON.stringify({
        type: "session.update",
        session: {
            input_audio_format: "pcm16",
            turn_detection: null,
            input_audio_transcription: { model: "whisper-1" },
        }
    }));
});

ws.on('message', (data) => {
    console.log('Received:', data.toString());
});

ws.on('error', (err) => {
    console.log('Error:', err.message);
});

ws.on('close', (code, reason) => {
    console.log('Closed:', code, reason.toString());
});
