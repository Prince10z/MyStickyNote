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
            audio: {
                input: {
                    format: { type: "audio/pcm", rate: 24000 },
                    transcription: { model: "whisper-1" },
                    turn_detection: null
                }
            }
        }
    }));
    
    setTimeout(() => {
        const audio = Buffer.alloc(48000);
        for(let i=0; i<24000; i++) {
            audio.writeInt16LE(Math.sin(i * 0.1) * 10000, i*2);
        }
        ws.send(JSON.stringify({
            type: "input_audio_buffer.append",
            audio: audio.toString('base64')
        }));
    }, 500);

    setTimeout(() => {
        ws.send(JSON.stringify({ type: "input_audio_buffer.commit" }));
        ws.send(JSON.stringify({
            type: "response.create",
            response: { modalities: ["text"] }
        }));
    }, 1000);
});

ws.on('message', (data) => {
    const msg = JSON.parse(data.toString());
    if (msg.type === 'error') console.log('ERROR:', JSON.stringify(msg.error));
    else console.log(msg.type);
    
    if(msg.type === 'conversation.item.input_audio_transcription.completed') {
        console.log('TRANSCRIPT:', msg.transcript);
        ws.close();
    }
});
