const fs = require('fs');
let code = fs.readFileSync('src/components/Apps/Chat.tsx', 'utf8');

const searchStr = `        // Auto-play the synthesized voice
        if (shouldSendVoice) {
          speakText(responses[i], friend.voiceId, 'minimax', settings).catch(err => console.error('Auto-play TTS error:', err));
        } else if (settings.minimaxEnabled && settings.minimaxApiKey) {
          speakText(responses[i], friend.voiceId, friend.voiceType || 'minimax', settings).catch(err => console.error('Auto-play TTS error:', err));
        }`;

const replaceStr = `        // Auto-play the synthesized voice ONLY if it's a voice message
        if (shouldSendVoice) {
          speakText(responses[i], friend.voiceId, 'minimax', settings).catch(err => console.error('Auto-play TTS error:', err));
        }`;

if (code.includes(searchStr)) {
    code = code.replace(searchStr, replaceStr);
    fs.writeFileSync('src/components/Apps/Chat.tsx', code);
    console.log("Replaced auto-play logic");
} else {
    console.log("Could not find auto-play logic");
}
