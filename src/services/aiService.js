import Groq from 'groq-sdk';

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;

const MODEL = 'llama-3.1-8b-instant';

/**
 * Call Groq API with a prompt using the official SDK.
 */
export async function callGroq(prompt) {
    if (!GROQ_API_KEY) {
        throw new Error('GROQ_API_KEY_NOT_SET');
    }

    try {
        const groq = new Groq({ apiKey: GROQ_API_KEY, dangerouslyAllowBrowser: true });
        const response = await groq.chat.completions.create({
            model: MODEL,
            messages: [{ role: "user", content: prompt }],
            temperature: 0.4,
            max_tokens: 2048,
        });
        return response.choices[0]?.message?.content || '';
    } catch (err) {
        console.warn(`Groq API failed.`, err);
        throw new Error(`Groq API Error: ${err.message}`);
    }
}

/**
 * Translate article text to target language (Groq fallback)
 */
export async function translateWithGroq(text, targetLang) {
    const prompt = `Translate the following news article text to ${targetLang}. Only output the translated text, nothing else.\n\n${text}`;
    return await callGroq(prompt);
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
    return await callGroq(prompt);
}

/**
 * Simplify complex sentences in the article
 */
export async function simplifyArticle(text) {
    const prompt = `Simplify the following news article so that it can be easily understood by a 12-year-old. Replace technical terms with simple explanations. Keep it informative but use everyday language.\n\n${text}`;
    return await callGroq(prompt);
}


