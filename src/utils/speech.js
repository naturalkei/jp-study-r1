// Web Speech API utility for authentic Japanese pronunciation

let isSpeaking = false;
let currentUtterance = null;
let preferredVoice = null;

// Initialize and select the best ja-JP voice
export function initSpeech() {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    console.warn('SpeechSynthesis is not supported in this browser.');
    return;
  }

  const loadVoices = () => {
    const voices = window.speechSynthesis.getVoices();
    preferredVoice =
      voices.find((v) => v.lang === 'ja-JP' && (v.name.includes('Google') || v.name.includes('Kyoko') || v.name.includes('Otoya') || v.name.includes('Natural'))) ||
      voices.find((v) => v.lang.startsWith('ja')) ||
      null;
  };

  loadVoices();
  if (window.speechSynthesis.onvoiceschanged !== undefined) {
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }
}

export function speakJapanese(text, rate = 0.85, onEndCallback = null) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    alert('현재 브라우저에서는 음성 합성(TTS) 기능을 지원하지 않습니다.');
    if (onEndCallback) onEndCallback();
    return;
  }

  // Cancel any ongoing speech
  window.speechSynthesis.cancel();

  // Strip furigana or parentheses for cleaner TTS pronunciation if present
  const cleanedText = text
    .replace(/\s+/g, '')
    .replace(/\(.*?\)/g, '')
    .replace(/（.*?）/g, '');

  const utterance = new SpeechSynthesisUtterance(cleanedText);
  utterance.lang = 'ja-JP';
  utterance.rate = rate; // 0.85x for optimal learning clarity
  utterance.pitch = 1.0;

  if (preferredVoice) {
    utterance.voice = preferredVoice;
  }

  utterance.onstart = () => {
    isSpeaking = true;
  };

  utterance.onend = () => {
    isSpeaking = false;
    currentUtterance = null;
    if (onEndCallback) onEndCallback();
  };

  utterance.onerror = (e) => {
    console.warn('TTS playback error:', e);
    isSpeaking = false;
    currentUtterance = null;
    if (onEndCallback) onEndCallback();
  };

  currentUtterance = utterance;
  window.speechSynthesis.speak(utterance);
}

export function stopSpeech() {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}
