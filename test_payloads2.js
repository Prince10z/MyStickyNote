const WebSocket = require('ws');

const url = 'wss://api.openai.com/v1/realtime?model=gpt-realtime-mini';
const headers = {
    Authorization: `Bearer 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`
};

function testPayload(sessionPayload) {
    return new Promise((resolve) => {
        const ws = new WebSocket(url, { headers });
        let errors = [];
        ws.on('open', () => {
            ws.send(JSON.stringify({
                type: "session.update",
                session: sessionPayload
            }));
            setTimeout(() => ws.close(), 1000);
        });
        ws.on('message', (data) => {
            const msg = JSON.parse(data.toString());
            if (msg.type === 'error') {
                errors.push(msg.error.message);
            }
        });
        ws.on('close', () => resolve(errors));
    });
}

async function run() {
    const payloads = [
        { type: "realtime", audio: { input: { turn_detection: null } } },
        { type: "realtime", turn_detection: null }
    ];

    for (let p of payloads) {
        console.log("Testing:", JSON.stringify(p));
        const errs = await testPayload(p);
        if (errs.length === 0) {
            console.log("-> SUCCESS!");
        } else {
            console.log("-> ERRORS:", errs);
        }
    }
}
run();
