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

export const speakText = async (text: string, voiceId?: string, voiceType?: 'gemini' | 'minimax', settings?: AppSettings) => {
  if (voiceType === 'minimax' && settings?.minimaxApiKey && settings?.minimaxGroupId && voiceId) {
    try {
      const baseUrl = settings.minimaxApiUrl || 'https://api.minimax.chat/v1/text_to_speech';
      const url = `${baseUrl}${(baseUrl || '').includes('?') ? '&' : '?'}GroupId=${settings.minimaxGroupId}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${settings.minimaxApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          voice_id: voiceId,
          text: text,
          model: "speech-01",
          speed: 1.0,
          vol: 1.0,
          pitch: 0
        })
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        audio.play().catch(err => console.error("Audio autoplay failed or blocked:", err));
        return;
      } else {
        console.error("Minimax TTS error:", await response.text());
      }
    } catch (err) {
      console.error("Minimax TTS fetch error:", err);
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
