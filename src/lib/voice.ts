import { AppSettings } from '../types';
import { apiFetch } from './apiHelper';

// Shared global audio player using HTML5 Audio with safe resource releasing and URL management
class SharedAudioPlayer {
  private static audio: HTMLAudioElement | null = null;
  private static isUnlocked = false;
  private static currentBlobUrl: string | null = null;

  private static base64ToBlobUrl(base64: string, mimeType: string): string {
    const binaryString = window.atob(base64.trim());
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    const blob = new Blob([bytes], { type: mimeType });
    return URL.createObjectURL(blob);
  }

  public static getAudio(): HTMLAudioElement {
    if (typeof window === 'undefined') {
      return {} as HTMLAudioElement;
    }
    if (!this.audio) {
      this.audio = new Audio();
      this.audio.addEventListener('error', (e) => {
        console.warn('Audio element error event (benign during transitions/unloads):', e);
      });
    }
    return this.audio;
  }

  public static async unlock(): Promise<boolean> {
    if (typeof window === 'undefined') return false;
    if (this.isUnlocked) return true;

    try {
      const audio = this.getAudio();
      
      // Inline highly compatible silent MP3 Data URL to unlock audio context/element
      // This bypasses any Blob URL lifecycle or revoking issues, and is 100% safe!
      const silentMp3DataUrl = 'data:audio/mpeg;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGFtZTMuOThyAh0AAAAAAAAAAAAAAP/NMQAAAAAAAAAAAAAAAAAAAAAASW5mbwAAAA8AAAACAAACigAOEhIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIy/80xAQAAAAAAAABgAAAANGgAAAAAAAAAAAAAAAACAgIDDx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8f/80xAgAAAAAAAABgAAAANGgAAAAAAAAAAAAAAAACAgIDDx9/Hx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8f/9tbX8=';
      
      audio.src = silentMp3DataUrl;
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        await playPromise.catch(e => console.warn('Silent audio play deferred:', e));
      }
      this.isUnlocked = true;
      console.log('🔊 Shared audio player unlocked successfully');
      return true;
    } catch (err) {
      console.warn('⚠️ Shared audio player unlock deferred:', err);
      this.isUnlocked = true;
      return true;
    }
  }

  public static async playBase64(base64Data: string): Promise<void> {
    const audio = this.getAudio();

    // 1. Pause current playback
    audio.pause();

    // 2. Safely unload existing source and revoke old blob URL
    if (this.currentBlobUrl) {
      // Unlink source first and force browser to unload it
      audio.removeAttribute('src');
      try {
        audio.load();
      } catch (e) {}

      // Now it is 100% safe to revoke the blob URL
      URL.revokeObjectURL(this.currentBlobUrl);
      this.currentBlobUrl = null;
    }

    // 3. Create a clean new Blob URL and play
    return new Promise((resolve, reject) => {
      try {
        this.currentBlobUrl = this.base64ToBlobUrl(base64Data, 'audio/mpeg');
        audio.src = this.currentBlobUrl;
        
        const onEnded = () => {
          audio.removeEventListener('ended', onEnded);
          audio.removeEventListener('error', onError);
          resolve();
        };

        const onError = (e: any) => {
          audio.removeEventListener('ended', onEnded);
          audio.removeEventListener('error', onError);
          reject(new Error('播放语音失败，请检查网络或配置'));
        };

        audio.addEventListener('ended', onEnded);
        audio.addEventListener('error', onError);
        
        const playPromise = audio.play();
        if (playPromise !== undefined) {
          playPromise.catch(err => {
            audio.removeEventListener('ended', onEnded);
            audio.removeEventListener('error', onError);
            if (err.name === 'AbortError' || err.message?.includes('interrupted')) {
              console.warn('Audio playback interrupted:', err);
              resolve(); // Interrupted is not a hard error for our UI
            } else {
              reject(err);
            }
          });
        }
      } catch (err: any) {
        reject(err);
      }
    });
  }

  public static stop() {
    if (this.audio) {
      try {
        this.audio.pause();
        this.audio.currentTime = 0;
      } catch (e) {}
    }
  }
}

// Auto-unlock on first user tap/click anywhere on screen
if (typeof window !== 'undefined') {
  const unlockOnGesture = () => {
    SharedAudioPlayer.unlock();
    document.removeEventListener('click', unlockOnGesture);
    document.removeEventListener('touchstart', unlockOnGesture, { capture: true });
  };
  document.addEventListener('click', unlockOnGesture);
  document.addEventListener('touchstart', unlockOnGesture, { passive: true, capture: true });
}

export const unlockAudio = () => {
  SharedAudioPlayer.unlock();
};

export const playBase64Audio = (base64Data: string): Promise<void> => {
  return SharedAudioPlayer.playBase64(base64Data);
};

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

export const speakText = async (text: string, voiceId?: string, voiceType?: 'gemini' | 'minimax' | string, settings?: AppSettings): Promise<void> => {
  // Always stop previous playbacks to avoid overlapping double-voices
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    window.speechSynthesis.pause();
    window.speechSynthesis.cancel();
  }
  SharedAudioPlayer.stop();

  // Try MiniMax if enabled or voiceType is minimax
  if ((settings?.minimaxEnabled || voiceType === 'minimax') && settings?.minimaxApiKey) {
    try {
      // Prime the player
      await SharedAudioPlayer.unlock();

      const data = await apiFetch({
        endpoint: '/api/tts',
        body: {
          text,
          voiceId: voiceId || settings.minimaxVoiceId,
          settings
        }
      });

      if (data.audio) {
        await SharedAudioPlayer.playBase64(data.audio);
        return;
      } else {
        throw new Error('未获取到语音数据');
      }
    } catch (err) {
      console.error("MiniMax TTS fetch error:", err);
      throw err;
    }
  }

  // Fallback to Web Speech API
  if (typeof window === 'undefined' || !window.speechSynthesis) {
    console.error("Web Speech API not supported");
    throw new Error('浏览器不支持语音合成');
  }
  
  window.speechSynthesis.cancel();
  
  return new Promise((resolve, reject) => {
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

    utterance.onend = () => resolve();
    utterance.onerror = (e) => reject(new Error('本地语音播放失败'));
    
    window.speechSynthesis.speak(utterance);
  });
};
