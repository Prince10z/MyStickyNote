const WebSocket = require('ws');

const url = 'wss://api.openai.com/v1/realtime?model=gpt-realtime-mini';
const headers = {
    Authorization: `Bearer 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`
};

const ws = new WebSocket(url, { headers });

ws.on('open', () => {
    ws.send(JSON.stringify({
        type: "session.update",
        session: {
            type: "transcription"
        }
    }));
    setTimeout(() => ws.close(), 1000);
});

ws.on('message', (data) => {
    const msg = JSON.parse(data.toString());
    console.log(msg.type, msg.error || '');
});
