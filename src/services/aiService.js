const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

/**
 * Call Gemini API with a prompt
 */
async function callGemini(prompt) {
    if (!GEMINI_API_KEY || GEMINI_API_KEY === 'YOUR_GEMINI_API_KEY_HERE') {
        throw new Error('GEMINI_API_KEY_NOT_SET');
    }

    const response = await fetch(`${GEMINI_URL}?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
                temperature: 0.4,
                maxOutputTokens: 2048
            }
        })
    });

    if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

/**
 * Translate article text to target language
 */
export async function translateArticle(text, targetLang) {
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
