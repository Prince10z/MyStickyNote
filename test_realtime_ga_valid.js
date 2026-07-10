const WebSocket = require('ws');

const url = 'wss://api.openai.com/v1/realtime?model=gpt-realtime-mini';
const headers = {
    Authorization: `Bearer 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`
};

const ws = new WebSocket(url, { headers });

ws.on('open', () => {
    // Only send the fields that we KNOW work, or find out what fields exist.
    // In previous test, we saw session.created gave us the DEFAULT session object from OpenAI!!
    // Let me print the default session object!
});

ws.on('message', (data) => {
    const msg = JSON.parse(data.toString());
    if (msg.type === 'session.created') {
        console.log(JSON.stringify(msg.session, null, 2));
        ws.close();
    }
});
