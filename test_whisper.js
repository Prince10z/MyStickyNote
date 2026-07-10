const WebSocket = require('ws');

const url = 'wss://api.openai.com/v1/realtime?model=gpt-realtime-whisper';
const headers = {
    Authorization: `Bearer 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`
};

const ws = new WebSocket(url, { headers });

ws.on('open', () => {
    ws.send(JSON.stringify({
        type: "session.update",
        session: {
            type: "transcription",
            audio: {
                input: {
                    format: { type: "audio/pcm", rate: 24000 },
                    transcription: { model: "gpt-realtime-whisper", delay: "low" },
                    turn_detection: null
                }
            }
        }
    }));
    
    // send some audio
    setTimeout(() => {
        const audio = Buffer.alloc(48000); // 1s
        ws.send(JSON.stringify({ type: "input_audio_buffer.append", audio: audio.toString('base64') }));
    }, 500);

    setTimeout(() => {
        ws.send(JSON.stringify({ type: "input_audio_buffer.commit" }));
    }, 1000);
});

ws.on('message', (data) => {
    const msg = JSON.parse(data.toString());
    console.log(msg.type, msg.error || '');
    if(msg.type === 'transcript.final') {
        process.exit(0);
    }
});
setTimeout(() => { ws.close(); }, 3000);
