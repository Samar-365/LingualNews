import axios from 'axios';

const API_KEY = import.meta.env.VITE_NEWS_API_KEY;
const BASE_URL = 'https://newsapi.org/v2';

const GNEWS_API_KEY = import.meta.env.VITE_GNEWS_API_KEY;
const GNEWS_BASE_URL = 'https://gnews.io/api/v4';

const CONTINENT_GNEWS_LANGS = {
    all: ['en', 'es', 'fr', 'hi', 'ja', 'pt', 'de'],
    north_america: ['en', 'es', 'fr'],
    europe: ['en', 'fr', 'de', 'es'],
    asia: ['hi', 'ja'], // regional asian languages
    oceania: ['en'],
    africa: ['en', 'fr', 'pt'], // Swahili not directly supported by gnews -> fallback to pt/fr/en
    south_america: ['es', 'pt']
};

const GNEWS_LANG_TO_NAME = {
    en: 'English',
    es: 'Spanish',
    fr: 'French',
    de: 'German',
    hi: 'Hindi',
    ja: 'Japanese',
    pt: 'Portuguese'
};

const CONTINENT_COUNTRY_MAP = {
    all: '',
    north_america: 'us',
    europe: 'gb',
    asia: 'in',
    oceania: 'au',
    africa: 'za',
    south_america: 'br'
};

// Fallback sample data for when API key is not configured
const SAMPLE_ARTICLES = [
    {
        source: { name: 'BBC News' },
        title: 'Global Leaders Discuss AI Regulation at Summit',
        description: 'World leaders gathered to discuss the future of artificial intelligence regulation and its impact on society.',
        url: 'https://www.bbc.com/news',
        urlToImage: null,
        publishedAt: '2026-03-10T10:00:00Z',
        content: 'World leaders from over 40 countries convened at the Global AI Summit to discuss comprehensive frameworks for artificial intelligence regulation. The summit, held in Geneva, addressed concerns about AI safety, ethical deployment, and the economic impact of rapidly advancing AI technologies. Key proposals included mandatory safety testing for large AI models, transparency requirements for AI-generated content, and international cooperation on AI governance standards.'
    },
    {
        source: { name: 'Reuters' },
        title: 'Breakthrough in Quantum Computing Achieves New Milestone',
        description: 'Scientists announce a major breakthrough in quantum computing that could revolutionize data processing.',
        url: 'https://www.reuters.com/',
        urlToImage: null,
        publishedAt: '2026-03-10T08:30:00Z',
        content: 'A team of researchers at MIT has achieved a groundbreaking milestone in quantum computing, successfully maintaining quantum coherence for over 10 minutes at near room temperature. This development significantly surpasses previous records and could pave the way for practical quantum computers. The team used a novel approach combining topological qubits with error-correction algorithms, potentially making quantum computing accessible for everyday applications including drug discovery, climate modeling, and cryptography.'
    },
    {
        source: { name: 'CNN' },
        title: 'New Space Mission to Explore Jupiter\'s Moon Europa',
        description: 'NASA announces a new mission to explore Europa, one of Jupiter\'s most promising moons for finding extraterrestrial life.',
        url: 'https://edition.cnn.com/',
        urlToImage: null,
        publishedAt: '2026-03-09T15:45:00Z',
        content: 'NASA has officially greenlit the Europa Deep Dive mission, an ambitious project to send a submersible probe beneath the ice crust of Jupiter\'s moon Europa. Scientists believe Europa\'s subsurface ocean could harbor conditions suitable for microbial life. The mission, scheduled for launch in 2031, will use advanced drilling technology to penetrate up to 5 kilometers of ice before deploying an autonomous underwater vehicle to explore the ocean beneath.'
    },
    {
        source: { name: 'Al Jazeera' },
        title: 'Renewable Energy Investments Surge Globally',
        description: 'Global investments in renewable energy hit record highs as countries accelerate their transition from fossil fuels.',
        url: 'https://www.aljazeera.com/',
        urlToImage: null,
        publishedAt: '2026-03-09T12:00:00Z',
        content: 'Global investments in renewable energy have reached an unprecedented $1.2 trillion in the first quarter of 2026, according to a new report from the International Energy Agency. Solar and wind energy projects lead the charge, with significant contributions from emerging battery storage technologies. India, Brazil, and several African nations have emerged as major growth markets, while China continues to dominate solar panel manufacturing. Analysts predict renewable energy could account for 60% of global electricity generation by 2030.'
    },
    {
        source: { name: 'TechCrunch' },
        title: 'Revolutionary Brain-Computer Interface Helps Paralyzed Patients',
        description: 'A new brain-computer interface technology allows paralyzed patients to control devices with unprecedented accuracy.',
        url: 'https://techcrunch.com/',
        urlToImage: null,
        publishedAt: '2026-03-08T18:20:00Z',
        content: 'Neuralink competitor Cortex Labs has unveiled a non-invasive brain-computer interface that enables paralyzed patients to control computers, smartphones, and robotic limbs with 98% accuracy. Unlike previous BCI systems, the new device requires no surgical implantation and can be set up in under 30 minutes. Clinical trials involving 200 patients showed remarkable results, with participants able to type, browse the internet, and even play video games using only their thoughts.'
    },
    {
        source: { name: 'The Guardian' },
        title: 'Major Climate Agreement Reached at Emergency Summit',
        description: 'Nations agree on binding emissions targets after unprecedented climate events in 2025.',
        url: 'https://www.theguardian.com/international',
        urlToImage: null,
        publishedAt: '2026-03-08T09:15:00Z',
        content: 'Following a series of devastating climate events in 2025, including record-breaking heatwaves and catastrophic flooding, 195 nations have signed a landmark climate agreement with legally binding emissions reduction targets. The agreement mandates a 50% reduction in greenhouse gas emissions by 2030 and net-zero emissions by 2045, five years ahead of previous targets. A $500 billion climate adaptation fund was also established to help vulnerable nations cope with the effects of climate change.'
    }
];

const CATEGORY_ARTICLES = {
    technology: SAMPLE_ARTICLES.filter((_, i) => [0, 1, 4].includes(i)),
    science: SAMPLE_ARTICLES.filter((_, i) => [1, 2, 4].includes(i)),
    business: SAMPLE_ARTICLES.filter((_, i) => [3, 0, 5].includes(i)),
    health: SAMPLE_ARTICLES.filter((_, i) => [4, 1, 5].includes(i)),
    politics: SAMPLE_ARTICLES.filter((_, i) => [0, 5, 3].includes(i)),
    sports: [
        {
            source: { name: 'ESPN' },
            title: 'Historic Victory in World Championship Finals',
            description: 'An underdog team claims victory in a thrilling championship final that captivated millions worldwide.',
            url: 'https://www.espn.com/',
            urlToImage: null,
            publishedAt: '2026-03-10T06:00:00Z',
            content: 'In one of the most dramatic sporting events of the decade, the underdog team pulled off a stunning upset in the World Championship finals. Trailing by a significant margin at halftime, the team mounted an incredible comeback driven by exceptional individual performances and tactical brilliance. The victory was celebrated by millions of fans worldwide and has been hailed as one of the greatest sporting moments in recent history.'
        }
    ]
};

/**
 * Get today's date string (YYYY-MM-DD) for cache key
 */
function getTodayKey() {
    return new Date().toISOString().slice(0, 10); // e.g. "2026-03-11"
}

/**
 * Read cached articles from localStorage (valid for today only)
 */
function getCachedArticles(category, continent = 'all', page = 1) {
    try {
        const raw = localStorage.getItem(`news_cache_v5_${category}_${continent}_${page}`);
        if (!raw) return null;
        const { date, articles } = JSON.parse(raw);
        // Only return from cache if we have actual articles to avoid getting stuck on an empty cache
        if (date === getTodayKey() && articles && articles.length > 0) return articles;
        // stale cache — different day or empty
        localStorage.removeItem(`news_cache_v5_${category}_${continent}_${page}`);
        return null;
    } catch {
        return null;
    }
}

/**
 * Write articles to localStorage with today's date
 */
function setCachedArticles(category, continent, page, articles) {
    try {
        localStorage.setItem(
            `news_cache_v5_${category}_${continent}_${page}`,
            JSON.stringify({ date: getTodayKey(), articles })
        );
    } catch {
        // localStorage full or unavailable — ignore
    }
}

/**
 * Generate fallback data of a consistent length (12) by repeating sample articles
 */
function getFallbackData(category, continent, page = 1) {
    let mockData = category === 'general' ? SAMPLE_ARTICLES : (CATEGORY_ARTICLES[category] || SAMPLE_ARTICLES.slice(0, 3));
    if (!mockData || mockData.length === 0) mockData = SAMPLE_ARTICLES;

    const count = 12; // Match the API pageSize
    const extendedData = [];
    while (extendedData.length < count * page + mockData.length) {
        extendedData.push(...mockData);
    }

    const baseIndex = (page - 1) * count;

    if (continent !== 'all') {
        const continentIndex = Object.keys(CONTINENT_COUNTRY_MAP).indexOf(continent);
        const startIndex = baseIndex + (continentIndex % mockData.length);
        return extendedData.slice(startIndex, startIndex + count);
    }
    
    return extendedData.slice(baseIndex, baseIndex + count);
}

/**
 * Fetch top headlines by category and continent (cached daily)
 */
export async function fetchTopHeadlines(category = 'general', continent = 'all', page = 1) {
    // If no valid NewsAPI key, return sample data directly
    if (!API_KEY || API_KEY === 'YOUR_NEWSAPI_KEY_HERE') {
        await new Promise(r => setTimeout(r, 800)); // simulate loading
        return getFallbackData(category, continent, page);
    }

    // Check daily cache first
    const cached = getCachedArticles(category, continent, page);
    if (cached) return cached;

    // Try GNews First if available
    if (GNEWS_API_KEY && GNEWS_API_KEY !== 'YOUR_GNEWS_API_KEY_HERE') {
        try {
            if (continent === 'all') {
                // Fetch a mix of languages for 'all' continents
                const mixLangs = ['en', 'hi', 'fr', 'es']; // Diverse subset to avoid rate limit spam
                const fetchPromises = mixLangs.map(async (l) => {
                    const req = await axios.get(`${GNEWS_BASE_URL}/top-headlines`, {
                        params: {
                            category: category === 'general' ? 'general' : category,
                            lang: l,
                            page: page,
                            max: 3, // 3 articles per language = 12 total
                            apikey: GNEWS_API_KEY
                        }
                    });
                    return (req.data?.articles || []).map(a => ({
                        source: { name: a.source?.name || 'GNews Source' },
                        title: a.title,
                        description: a.description,
                        url: a.url,
                        urlToImage: a.image,
                        publishedAt: a.publishedAt,
                        content: a.content,
                        feedLanguage: GNEWS_LANG_TO_NAME[l]
                    }));
                });

                const resultsSet = await Promise.allSettled(fetchPromises);
                const allMapped = [];

                // Interleave the results so languages alternate in the feed
                for (let i = 0; i < 3; i++) {
                    resultsSet.forEach(res => {
                        if (res.status === 'fulfilled' && res.value[i]) {
                            allMapped.push(res.value[i]);
                        }
                    });
                }

                if (allMapped.length > 0) {
                    setCachedArticles(category, continent, page, allMapped);
                    return allMapped;
                }

            } else {
                // Target specific continent language
                const langs = CONTINENT_GNEWS_LANGS[continent] || ['en'];
                const randomLangCode = langs[Math.floor(Math.random() * langs.length)];
                const feedLanguageName = GNEWS_LANG_TO_NAME[randomLangCode];

                const gnewsParams = {
                    category: category === 'general' ? 'general' : category,
                    lang: randomLangCode,
                    page: page,
                    max: 12,
                    apikey: GNEWS_API_KEY
                };

                const gnewsRes = await axios.get(`${GNEWS_BASE_URL}/top-headlines`, { params: gnewsParams });
                if (gnewsRes.data && gnewsRes.data.articles && gnewsRes.data.articles.length > 0) {
                    const mappedArticles = gnewsRes.data.articles.map(a => ({
                        source: { name: a.source?.name || 'GNews Source' },
                        title: a.title,
                        description: a.description,
                        url: a.url,
                        urlToImage: a.image, // GNews uses 'image'
                        publishedAt: a.publishedAt,
                        content: a.content,
                        feedLanguage: feedLanguageName
                    }));
                    setCachedArticles(category, continent, page, mappedArticles);
                    return mappedArticles;
                }
            }
        } catch (gnewsErr) {
            console.error('GNews API failed, falling back to NewsAPI:', gnewsErr);
        }
    }

    try {
        const country = CONTINENT_COUNTRY_MAP[continent];
        const params = {
            category,
            page: page,
            pageSize: 12,
            apiKey: API_KEY
        };

        if (country) {
            params.country = country;
            // Note: NewsAPI top-headlines endpoint often throws an error if
            // you mix `country` and `language` in the same request depending
            // on the exact combination.
        } else {
            params.language = 'en'; // default for global
        }

        const response = await axios.get(`${BASE_URL}/top-headlines`, { params });
        let articles = response.data.articles || [];
        
        // If the API succeeds but returns 0 articles (often happens with specific country combinations like 'in' + specific categories on the free tier),
        // fallback to the mock sample data to prevent the UI from showing empty states or loading indefinitely.
        if (articles.length === 0) {
            console.warn(`No articles found for ${category} and ${country}. Falling back to sample data.`);
            articles = getFallbackData(category, continent, page);
        }



        setCachedArticles(category, continent, page, articles); // store for the rest of today
        return articles;
    } catch (error) {
        console.error('NewsAPI error:', error);
        
        // Final fallback in case of actual request error
        return getFallbackData(category, continent, page);
    }
}

/**
 * Search news articles by query
 */
export async function searchNews(query) {
    if (!API_KEY || API_KEY === 'YOUR_NEWSAPI_KEY_HERE') {
        await new Promise(r => setTimeout(r, 800));
        return SAMPLE_ARTICLES.filter(a =>
            a.title.toLowerCase().includes(query.toLowerCase()) ||
            a.description.toLowerCase().includes(query.toLowerCase())
        );
    }

    try {
        const response = await axios.get(`${BASE_URL}/everything`, {
            params: {
                q: query,
                language: 'en',
                sortBy: 'publishedAt',
                pageSize: 12,
                apiKey: API_KEY
            }
        });
        return response.data.articles || [];
    } catch (error) {
        console.error('NewsAPI search error:', error);
        return [];
    }
}
