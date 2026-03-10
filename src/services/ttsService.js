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

    synth.speak(currentUtterance);
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
        'Marathi': 'mr-IN',
        'French': 'fr-FR'
    };
    return langMap[langName] || 'en-US';
}
