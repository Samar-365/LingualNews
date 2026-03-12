import { GoogleGenAI } from '@google/genai';

const GEMINI_KEYS = [
    import.meta.env.VITE_GEMINI_API_KEY,
    import.meta.env.VITE_GEMINI_API_KEY_2,
].filter(k => k && k !== 'YOUR_GEMINI_API_KEY_HERE');

const MODEL = 'gemini-3-flash-preview';

/**
 * Call Gemini API with a prompt using the official SDK.
 * Falls back to the second API key if the first is rate-limited.
 */
export async function callGemini(prompt) {
    if (GEMINI_KEYS.length === 0) {
        throw new Error('GEMINI_API_KEY_NOT_SET');
    }

    let lastError = null;

    for (const key of GEMINI_KEYS) {
        try {
            const ai = new GoogleGenAI({ apiKey: key });
            const response = await ai.models.generateContent({
                model: MODEL,
                contents: prompt,
                config: {
                    temperature: 0.4,
                    maxOutputTokens: 2048,
                },
            });
            return response.text || '';
        } catch (err) {
            console.warn(`Gemini (key …${key.slice(-4)}) failed: ${err.message}`);
            lastError = err;

            // If rate-limited, try next key
            if (err.message?.includes('429') || err.message?.includes('503') || err.message?.includes('RESOURCE_EXHAUSTED')) {
                continue;
            }

            // Other errors — throw immediately
            throw err;
        }
    }

    // All keys exhausted — wait and retry once
    console.warn('All API keys rate-limited. Waiting 10s before final retry…');
    await new Promise(resolve => setTimeout(resolve, 10000));

    try {
        const ai = new GoogleGenAI({ apiKey: GEMINI_KEYS[0] });
        const response = await ai.models.generateContent({
            model: MODEL,
            contents: prompt,
            config: {
                temperature: 0.4,
                maxOutputTokens: 2048,
            },
        });
        return response.text || '';
    } catch {
        throw lastError || new Error('Gemini API is currently rate-limited. Please try again in a minute.');
    }
}

/**
 * Translate article text to target language (Gemini fallback)
 */
export async function translateWithGemini(text, targetLang) {
    const prompt = `Translate the following news article text to ${targetLang}. Only output the translated text, nothing else.\n\n${text}`;
    return await callGemini(prompt);
}

/**
 * Summarize article text
 * @param {string} text - Article text
 * @param {'bullet'|'paragraph'|'quick'} mode - Summary type
 */
export async function summarizeArticle(text, mode = 'bullet') {
    let prompt;
    switch (mode) {
        case 'bullet':
            prompt = `Summarize the following news article as 4-6 concise bullet points. Each bullet should capture a key point. Format each bullet starting with "• ".\n\n${text}`;
            break;
        case 'paragraph':
            prompt = `Summarize the following news article in a single short paragraph (3-4 sentences max). Be concise and focus on the most important information.\n\n${text}`;
            break;
        case 'quick':
            prompt = `Create a 30-second quick read summary of the following news article. It should be 2-3 sentences that capture the essential information a busy reader needs to know.\n\n${text}`;
            break;
        default:
            prompt = `Summarize the following news article concisely:\n\n${text}`;
    }
    return await callGemini(prompt);
}

/**
 * Simplify complex sentences in the article
 */
export async function simplifyArticle(text) {
    const prompt = `Simplify the following news article so that it can be easily understood by a 12-year-old. Replace technical terms with simple explanations. Keep it informative but use everyday language.\n\n${text}`;
    return await callGemini(prompt);
}

/**
 * Extract key information (people, places, events, dates)
 */
export async function extractKeyInfo(text) {
    const prompt = `Extract key information from the following news article. Return the result in this exact format (use "N/A" if not found):

People: [names of people mentioned]
Locations: [places mentioned]
Organizations: [organizations mentioned]
Events: [key events]
Dates: [important dates mentioned]
Topics: [main topics/themes]

Article:
${text}`;

    const result = await callGemini(prompt);

    // Parse the result into structured data
    const info = {};
    const lines = result.split('\n').filter(l => l.trim());
    for (const line of lines) {
        const colonIdx = line.indexOf(':');
        if (colonIdx > 0) {
            const key = line.substring(0, colonIdx).trim();
            const value = line.substring(colonIdx + 1).trim();
            if (key && value) {
                info[key] = value;
            }
        }
    }
    return info;
}
