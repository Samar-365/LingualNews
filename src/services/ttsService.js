/**
 * Text-to-Speech service using browser SpeechSynthesis API
 */

let currentUtterance = null;

/**
 * Speak the given text
 * @param {string} text - Text to speak
 * @param {string} lang - Language code (e.g., 'en-US', 'hi-IN', 'es-ES')
 * @param {Function} onEnd - Callback when speech ends
 */
export function speak(text, lang = 'en-US', onEnd = () => { }) {
    stop(); // Stop any current speech

    const synth = window.speechSynthesis;
    currentUtterance = new SpeechSynthesisUtterance(text);
    currentUtterance.lang = lang;
    currentUtterance.rate = 0.95;
    currentUtterance.pitch = 1;
    currentUtterance.onend = onEnd;
    currentUtterance.onerror = onEnd;

    // Explicitly find and assign a voice for the requested language.
    // Some browsers/OS combinations fail to play audio if the exact voice object isn't assigned,
    // especially for regional variations.
    let voices = synth.getVoices();
    
    // Fallback logic to get voices if they aren't loaded immediately (Safari/Chrome quirk)
    if (voices.length === 0) {
        synth.onvoiceschanged = () => {
            voices = synth.getVoices();
            assignVoiceAndSpeak(synth, currentUtterance, voices, lang);
        };
    } else {
        assignVoiceAndSpeak(synth, currentUtterance, voices, lang);
    }
}

function assignVoiceAndSpeak(synth, utterance, voices, targetLang) {
    // 1. Try to find an exact match for the language code (e.g., 'es-ES')
    let selectedVoice = voices.find(v => v.lang === targetLang);
    
    // 2. Try to find a partial match (e.g., 'es' in 'es-ES')
    if (!selectedVoice) {
        const shortLang = targetLang.split('-')[0];
        selectedVoice = voices.find(v => v.lang.startsWith(shortLang));
    }
    
    // 3. Fallback to Google's specific voices if available, or just take the first matching language
    if (selectedVoice) {
        utterance.voice = selectedVoice;
    } else {
        console.warn(`No specific TTS voice found for ${targetLang}. Falling back to system default.`);
    }

    synth.speak(utterance);
}

/**
 * Pause current speech
 */
export function pause() {
    window.speechSynthesis.pause();
}

/**
 * Resume paused speech
 */
export function resume() {
    window.speechSynthesis.resume();
}

/**
 * Stop all speech
 */
export function stop() {
    window.speechSynthesis.cancel();
    currentUtterance = null;
}

/**
 * Check if speech synthesis is currently speaking
 */
export function isSpeaking() {
    return window.speechSynthesis.speaking;
}

/**
 * Check if speech synthesis is paused
 */
export function isPaused() {
    return window.speechSynthesis.paused;
}

/**
 * Get the language code for TTS from language name
 */
export function getLangCode(langName) {
    const langMap = {
        'English': 'en-US',
        'Hindi': 'hi-IN',
        'Spanish': 'es-ES',
        'French': 'fr-FR',
        'German': 'de-DE',
        'Japanese': 'ja-JP',
        'Portuguese': 'pt-PT',
        'Swahili': 'sw-KE',
        'Maori': 'mi-NZ'
    };
    return langMap[langName] || 'en-US';
}
