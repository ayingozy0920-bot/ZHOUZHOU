import { AppSettings } from '../types';

export const getAvailableVoices = (): SpeechSynthesisVoice[] => {
  if (typeof window === 'undefined' || !window.speechSynthesis) return [];
  let voices = window.speechSynthesis.getVoices();
  
  // If voices are not loaded yet, some browsers might return an empty array
  // We can't do much here but Chat.tsx already handles onvoiceschanged
  
  return voices;
};

// Helper to identify male voices (heuristic)
export const isMaleVoice = (voice: SpeechSynthesisVoice) => {
  const name = voice.name.toLowerCase();
  return name.includes('male') || name.includes('guy') || name.includes('man') || name.includes('boy') || 
         name.includes('kangkang') || name.includes('yunxi') || name.includes('yunjian') || name.includes('liaoliao');
};

export const speakText = async (text: string, voiceId?: string, voiceType?: 'gemini' | 'minimax' | string, settings?: AppSettings) => {
  // Try MiniMax if enabled or voiceType is minimax
  if ((settings?.minimaxEnabled || voiceType === 'minimax') && settings?.minimaxApiKey) {
    try {
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          voiceId: voiceId || settings.minimaxVoiceId,
          settings
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.audio) {
          const audio = new Audio(`data:audio/mp3;base64,${data.audio}`);
          audio.play().catch(err => console.error("Audio autoplay failed or blocked:", err));
          return;
        }
      } else {
        const err = await response.json();
        console.error("MiniMax TTS proxy error:", err.error);
      }
    } catch (err) {
      console.error("MiniMax TTS fetch error:", err);
    }
  }

  // Fallback to Web Speech API
  if (typeof window === 'undefined' || !window.speechSynthesis) {
    console.error("Web Speech API not supported");
    return;
  }
  
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  
  const voices = window.speechSynthesis.getVoices();
  if (voiceId && voiceType !== 'minimax') {
    const selectedVoice = voices.find(v => v.voiceURI === voiceId || v.name === voiceId);
    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }
  } else {
    // Default to a Chinese voice if available
    const zhVoice = voices.find(v => (v.lang || '').includes('zh')) || voices[0];
    if (zhVoice) {
      utterance.voice = zhVoice;
    }
  }
  
  window.speechSynthesis.speak(utterance);
};
