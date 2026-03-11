const LINGO_API_KEY = import.meta.env.VITE_LINGO_API_KEY;
const LINGO_API_URL = 'https://api.lingo.dev/process/localize';

/**
 * Map language names to locale codes for lingo.dev
 */
const LOCALE_MAP = {
    'English': 'en',
    'Hindi': 'hi',
    'Spanish': 'es',
    'Marathi': 'mr',
    'French': 'fr'
};

/**
 * Translate article text using lingo.dev REST API.
 * Falls back to Gemini if lingo.dev fails.
 */
export async function translateArticle(text, targetLang) {
    const targetLocale = LOCALE_MAP[targetLang] || 'en';

    // Don't translate if target is English (source language)
    if (targetLocale === 'en') {
        return text;
    }

    try {
        const response = await fetch(LINGO_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json; charset=utf-8',
                'X-API-Key': LINGO_API_KEY,
            },
            body: JSON.stringify({
                sourceLocale: 'en',
                targetLocale: targetLocale,
                data: { text: text },
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Lingo.dev API error (${response.status}): ${errorText}`);
        }

        const result = await response.json();
        return result.data?.text || text;
    } catch (err) {
        console.warn('Lingo.dev translation failed, falling back to Gemini:', err.message);

        // Fallback to Gemini
        const { translateWithGemini } = await import('./aiService.js');
        return await translateWithGemini(text, targetLang);
    }
}
