import { callGroq } from './aiService';

/**
 * Fetch strategies — local proxy first (bypasses CORS + CDN), then external proxies.
 */
const FETCH_STRATEGIES = [
    // Strategy 1: Local Vite dev proxy (server-side fetch with real User-Agent)
    (url) => `/api/scrape?url=${encodeURIComponent(url)}`,
    // Strategy 2-4: External CORS proxies as fallbacks
    (url) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
    (url) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
    (url) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`,
];

/**
 * Patterns that indicate a blocked/error page rather than real content
 */
const ACCESS_DENIED_PATTERNS = [
    'access denied',
    'access is denied',
    'error 403',
    'forbidden',
    'please enable javascript',
    'are you a robot',
    'captcha',
    'cloudflare',
    'akamai',
    'reference #',
];

/**
 * Scrape article content from a URL.
 * Uses multiple CORS proxies and robust HTML parsing to extract article text.
 * Falls back to Groq AI for content extraction if heuristics fail.
 *
 * @param {string} url - The article URL to scrape
 * @returns {Promise<{title: string, content: string, source: string, image: string|null}>}
 */
export async function scrapeArticle(url) {
    const html = await fetchHTML(url);

    if (!html || html.length < 100) {
        throw new Error('Could not fetch the article page. The site may be blocking automated requests.');
    }

    const doc = new DOMParser().parseFromString(html, 'text/html');

    // Extract metadata
    const title = extractTitle(doc);
    const image = extractImage(doc, url);
    const source = extractSource(doc, url);

    // Extract main article content
    let content = extractContent(doc);

    // If extraction yielded too little, try Groq
    if (content.length < 100) {
        try {
            content = await extractWithGroq(html, url);
        } catch {
            // Groq not available — continue with what we have
        }
    }

    // Last resort: use meta description + any paragraphs we found
    if (content.length < 50) {
        const metaDesc = doc.querySelector('meta[property="og:description"]')?.getAttribute('content')
            || doc.querySelector('meta[name="description"]')?.getAttribute('content')
            || '';
        if (metaDesc.length > 30) {
            content = metaDesc;
        }
    }

    if (!content || content.length < 30) {
        throw new Error('Could not extract article content from this URL. The page may be behind a paywall or require JavaScript.');
    }

    return { title, content, source, image };
}

/**
 * Check if HTML looks like an access-denied / bot-detection page.
 */
function isBlockedResponse(html) {
    const lower = html.toLowerCase().substring(0, 3000);
    return ACCESS_DENIED_PATTERNS.some(p => lower.includes(p));
}

/**
 * Fetch raw HTML of a page, trying the local proxy first, then CORS proxies.
 */
async function fetchHTML(url) {
    let lastError = null;

    for (const strategyFn of FETCH_STRATEGIES) {
        try {
            const fetchUrl = strategyFn(url);
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 15000); // 15s timeout

            const response = await fetch(fetchUrl, {
                signal: controller.signal,
                headers: {
                    'Accept': 'text/html,application/xhtml+xml,*/*',
                }
            });
            clearTimeout(timeout);

            if (!response.ok) {
                lastError = new Error(`Fetch returned status ${response.status}`);
                continue;
            }

            let text = await response.text();

            // Some proxies return JSON wrapping
            if (text.startsWith('{') && text.includes('"contents"')) {
                try {
                    const json = JSON.parse(text);
                    if (json.contents) text = json.contents;
                } catch { /* not JSON, use raw text */ }
            }

            // Check for blocked/error pages
            if (isBlockedResponse(text)) {
                lastError = new Error('Site returned an access-denied page');
                continue; // try next strategy
            }

            if (text.length > 500) return text;
            lastError = new Error('Response was too short');
        } catch (err) {
            lastError = err;
            continue;
        }
    }

    throw new Error(
        `Failed to fetch article after trying ${FETCH_STRATEGIES.length} methods. ` +
        (lastError?.message || 'Unknown error')
    );
}

/**
 * Extract the page title from meta tags or <title>
 */
function extractTitle(doc) {
    const ogTitle = doc.querySelector('meta[property="og:title"]')?.getAttribute('content');
    if (ogTitle) return ogTitle.trim();

    const twTitle = doc.querySelector('meta[name="twitter:title"]')?.getAttribute('content');
    if (twTitle) return twTitle.trim();

    const titleTag = doc.querySelector('title')?.textContent;
    if (titleTag) return titleTag.trim();

    const h1 = doc.querySelector('h1')?.textContent;
    if (h1) return h1.trim();

    return 'Scraped Article';
}

/**
 * Extract the hero/thumbnail image
 */
function extractImage(doc, url) {
    const ogImage = doc.querySelector('meta[property="og:image"]')?.getAttribute('content');
    if (ogImage) return resolveUrl(ogImage, url);

    const twImage = doc.querySelector('meta[name="twitter:image"]')?.getAttribute('content');
    if (twImage) return resolveUrl(twImage, url);

    return null;
}

/**
 * Extract the source/site name
 */
function extractSource(doc, url) {
    const ogSite = doc.querySelector('meta[property="og:site_name"]')?.getAttribute('content');
    if (ogSite) return ogSite.trim();

    try {
        return new URL(url).hostname.replace('www.', '');
    } catch {
        return 'Unknown Source';
    }
}

/**
 * Extract main article content using common selectors and heuristics.
 */
function extractContent(doc) {
    // Remove known noise elements
    const noiseSelectors = [
        'script', 'style', 'nav', 'footer', 'aside',
        'iframe', 'noscript', 'svg', 'video', 'audio',
        '.ad', '.ads', '.advertisement', '.sidebar',
        '.comments', '.comment', '.social-share', '.related',
        '.share', '.sharing', '.social',
        '[role="navigation"]', '[role="banner"]', '[role="complementary"]',
        '.cookie-banner', '.popup', '.modal', '.newsletter',
        'form', '.breadcrumb', '.pagination',
        '.header', '.site-header', '.main-header',
        '.footer', '.site-footer',
        '.recommended', '.trending', '.also-read',
        '.widget', '.promo'
    ];
    noiseSelectors.forEach(sel => {
        try {
            doc.querySelectorAll(sel).forEach(el => el.remove());
        } catch { /* ignore invalid selectors */ }
    });

    // Try common article content selectors (ordered by specificity)
    const contentSelectors = [
        // Specific article body selectors
        '.post_content',           // NDTV uses this
        '.story__content',         // NDTV
        '.article__content',
        '.article-body',
        '.article_body',
        '.story-body',
        '.story_body',
        '.post-content',
        '.post-body',
        '.entry-content',
        '.content-body',
        '.text-content',
        '.article-text',
        '.story-text',
        '.article-detail',

        // Schema/data attributes
        '[itemprop="articleBody"]',
        '[data-component="text-block"]',
        '[data-article-body]',

        // Generic article containers
        'article .content',
        'article',
        'main article',
        'main',
        '[role="main"]',
        '#article-body',
        '#story-body',
        '#content-body',
        '.content',
        '#content'
    ];

    for (const selector of contentSelectors) {
        try {
            const el = doc.querySelector(selector);
            if (el) {
                const text = extractTextFromElement(el);
                if (text.length > 100) return text;
            }
        } catch { /* ignore */ }
    }

    // Fallback: collect ALL <p> tags with any meaningful text
    const paragraphs = Array.from(doc.querySelectorAll('p'))
        .map(p => p.textContent.trim())
        .filter(t => t.length > 20 && !isBoilerplate(t));

    if (paragraphs.length > 0) {
        return paragraphs.join('\n\n');
    }

    // Absolute fallback: try all divs and find the one with the most text
    const divs = Array.from(doc.querySelectorAll('div'))
        .map(div => ({
            el: div,
            text: extractTextFromElement(div),
            pCount: div.querySelectorAll('p').length
        }))
        .filter(d => d.text.length > 100 && d.pCount >= 2)
        .sort((a, b) => b.pCount - a.pCount || b.text.length - a.text.length);

    if (divs.length > 0) {
        return divs[0].text;
    }

    return '';
}

/**
 * Check if text is likely boilerplate/navigation text
 */
function isBoilerplate(text) {
    const lower = text.toLowerCase();
    const boilerplatePatterns = [
        'cookie', 'privacy policy', 'terms of', 'subscribe',
        'sign up', 'log in', 'copyright', 'all rights reserved',
        'advertisement', 'sponsored', 'follow us', 'download app',
        'newsletter', 'click here'
    ];
    return boilerplatePatterns.some(p => lower.includes(p));
}

/**
 * Extract clean text from a DOM element, preserving paragraph structure.
 */
function extractTextFromElement(element) {
    const blocks = element.querySelectorAll('p, h2, h3, h4, blockquote, li');

    if (blocks.length > 0) {
        return Array.from(blocks)
            .map(p => p.textContent.trim())
            .filter(t => t.length > 10 && !isBoilerplate(t))
            .join('\n\n');
    }

    // Fallback to textContent, cleaned up
    return element.textContent
        .replace(/[ \t]+/g, ' ')
        .replace(/\n\s*\n/g, '\n\n')
        .trim();
}

/**
 * Use Groq to extract article content from raw HTML.
 */
async function extractWithGroq(html, url) {
    // Truncate HTML to avoid token limits
    const truncatedHtml = html.substring(0, 15000);

    const prompt = `Extract the main news article text from this HTML page (URL: ${url}).

Rules:
- Return ONLY the article body text, nothing else
- Preserve paragraph breaks
- Do NOT include navigation, ads, sidebars, author bios, or related links
- If no article content is found, return exactly "NO_CONTENT"

HTML:
${truncatedHtml}`;

    try {
        const result = await callGroq(prompt);
        if (result === 'NO_CONTENT' || result.length < 50) {
            return '';
        }
        return result;
    } catch {
        return '';
    }
}

/**
 * Resolve a possibly-relative URL against the page URL.
 */
function resolveUrl(relativeUrl, baseUrl) {
    try {
        return new URL(relativeUrl, baseUrl).href;
    } catch {
        return relativeUrl;
    }
}
