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
 * @param {string} targetLang - Language to summarize the article in
 */
export async function summarizeArticle(text, mode = 'bullet', targetLang = 'English') {
    let prompt;
    switch (mode) {
        case 'bullet':
            prompt = `Read the following news article. Summarize it as 4-6 concise bullet points. Each bullet should capture a key point. Format each bullet starting with "• ". 
CRITICAL: You MUST write the entire summary in ${targetLang}. Do not output the original language if it is different.

Article:
${text}`;
            break;
        case 'paragraph':
            prompt = `Read the following news article. Summarize it in a single short paragraph (3-4 sentences max). Be concise and focus on the most important information.
CRITICAL: You MUST write the entire summary in ${targetLang}. Do not output the original language if it is different.

Article:
${text}`;
            break;
        case 'quick':
            prompt = `Read the following news article. Create a 30-second quick read summary (2-3 sentences) that captures the essential information a busy reader needs to know.
CRITICAL: You MUST write the entire summary in ${targetLang}. Do not output the original language if it is different.

Article:
${text}`;
            break;
        default:
            prompt = `Summarize the following news article concisely. 
CRITICAL: You MUST write the entire summary in ${targetLang}. Do not output the original language if it is different.

Article:
${text}`;
    }
    return await callGroq(prompt);
}

/**
 * Simplify complex sentences in the article
 */
export async function simplifyArticle(text, targetLang = 'English') {
    const prompt = `You are a helpful translator and simplifier. Read the following news article. 
Task:
1. Simplify the text so a 12-year-old can easily understand it. Replace technical terms with simple words. Keep it informative but use everyday language.
2. TRANSLATE the simplified text into ${targetLang}. 

CRITICAL: The final output MUST be entirely written in ${targetLang}. Do not use the original language if it is not ${targetLang}.

Article:
${text}`;
    return await callGroq(prompt);
}


