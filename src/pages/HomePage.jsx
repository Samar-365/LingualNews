import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchTopHeadlines } from '../services/newsService';
import NewsCard from '../components/NewsCard';

const CATEGORIES = [
    { id: 'general', label: 'All' },
    { id: 'technology', label: 'Technology' },
    { id: 'politics', label: 'Politics' },
    { id: 'business', label: 'Business' },
    { id: 'sports', label: 'Sports' },
    { id: 'science', label: 'Science' },
    { id: 'health', label: 'Health' }
];

export default function HomePage({ continent }) {
    const [articles, setArticles] = useState([]);
    const [activeCategory, setActiveCategory] = useState('general');
    const [loading, setLoading] = useState(true);
    const [inputMode, setInputMode] = useState('url'); // 'url' or 'text'
    const [inputValue, setInputValue] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        loadArticles(activeCategory, continent);
    }, [activeCategory, continent]);

    async function loadArticles(category, cont) {
        setLoading(true);
        try {
            const data = await fetchTopHeadlines(category, cont);
            setArticles(data);
        } catch (err) {
            console.error('Failed to load articles:', err);
        } finally {
            setLoading(false);
        }
    }

    function handleCardClick(article, index) {
        // Store article in sessionStorage so ArticlePage can read it
        sessionStorage.setItem('selectedArticle', JSON.stringify(article));
        navigate(`/article/${index}`);
    }

    function handleAnalyze() {
        if (!inputValue.trim()) return;

        const isUrl = inputValue.startsWith('http://') || inputValue.startsWith('https://');
        const article = {
            source: { name: isUrl ? 'Custom URL' : 'User Input' },
            title: isUrl ? 'Analyzing Article from URL...' : 'Custom Article Analysis',
            description: isUrl ? inputValue : inputValue.substring(0, 150) + '...',
            content: isUrl ? null : inputValue,
            url: isUrl ? inputValue : null,
            publishedAt: new Date().toISOString(),
            customInput: true,
            inputUrl: isUrl ? inputValue : null
        };

        sessionStorage.setItem('selectedArticle', JSON.stringify(article));
        // Store preferred language so ArticlePage can auto-translate
        const savedLang = sessionStorage.getItem('preferredLanguage');
        if (!savedLang) {
            sessionStorage.setItem('preferredLanguage', 'Hindi');
        }
        navigate('/article/custom');
    }

    return (
        <main>
            {/* Hero Section */}
            <section className="hero" id="hero-section">
                <div className="container">
                    <h1 className="hero__title">
                        MULTILINGUAL NEWS<br />SIMPLIFIER
                    </h1>
                    <p className="hero__subtitle">
                        Decode global news instantly. Translate · Summarize · Simplify
                        <span className="hero__cursor"></span>
                    </p>

                    {/* Input Box */}
                    <div className="input-box" id="article-input">
                        <div className="input-box__tabs">
                            <button
                                className={`input-box__tab ${inputMode === 'url' ? 'input-box__tab--active' : ''}`}
                                onClick={() => setInputMode('url')}
                            >
                                Paste URL
                            </button>
                            <button
                                className={`input-box__tab ${inputMode === 'text' ? 'input-box__tab--active' : ''}`}
                                onClick={() => setInputMode('text')}
                            >
                                Paste Text
                            </button>
                        </div>

                        {inputMode === 'url' ? (
                            <div className="input-box__wrapper">
                                <input
                                    className="input-box__input"
                                    type="url"
                                    placeholder="> paste article URL here..."
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
                                    id="url-input"
                                />
                                <button
                                    className="input-box__btn"
                                    onClick={handleAnalyze}
                                    id="analyze-btn"
                                >
                                    ▶ Analyze
                                </button>
                            </div>
                        ) : (
                            <>
                                <textarea
                                    className="input-box__textarea"
                                    placeholder="> paste article text here..."
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                    id="text-input"
                                />
                                <div className="input-box__submit-row">
                                    <button
                                        className="input-box__btn"
                                        onClick={handleAnalyze}
                                        id="analyze-text-btn"
                                        style={{ borderRadius: 'var(--radius)' }}
                                    >
                                        ▶ Analyze
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </section>

            {/* Category Filter */}
            <section className="categories container" id="categories">
                <ul className="categories__list">
                    {CATEGORIES.map(cat => (
                        <li key={cat.id}>
                            <button
                                className={`categories__item ${activeCategory === cat.id ? 'categories__item--active' : ''}`}
                                onClick={() => setActiveCategory(cat.id)}
                                id={`category-${cat.id}`}
                            >
                                {cat.label}
                            </button>
                        </li>
                    ))}
                </ul>
            </section>

            {/* News Grid */}
            <section className="container" id="news-feed">
                {loading ? (
                    <div className="loader">
                        <div className="loader__spinner"></div>
                        <div className="loader__text">Fetching global news...</div>
                    </div>
                ) : articles.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-state__icon">📡</div>
                        <p className="empty-state__text">No articles found. Try a different category.</p>
                    </div>
                ) : (
                    <div className="news-grid">
                        {articles.map((article, index) => (
                            <NewsCard
                                key={index}
                                article={article}
                                index={index}
                                onClick={handleCardClick}
                            />
                        ))}
                    </div>
                )}
            </section>
        </main>
    );
}
