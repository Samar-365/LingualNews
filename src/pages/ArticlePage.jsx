import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    summarizeArticle,
    simplifyArticle
} from '../services/aiService';
import { translateArticle } from '../services/translationService';
import { speak, stop, isSpeaking, getLangCode } from '../services/ttsService';
import { scrapeArticle } from '../services/scraperService';

const LANGUAGES = ['English', 'Hindi', 'Spanish', 'Marathi', 'French', 'German', 'Japanese', 'Portuguese', 'Swahili', 'Maori'];

export default function ArticlePage({ language }) {
    const navigate = useNavigate();
    const [article, setArticle] = useState(null);
    const [displayedContent, setDisplayedContent] = useState('');

    // Scraping state
    const [scraping, setScraping] = useState(false);
    const [scrapeStatus, setScrapeStatus] = useState('');

    // AI results
    const [translatedText, setTranslatedText] = useState('');
    const [summary, setSummary] = useState('');
    const [simplified, setSimplified] = useState('');

    // UI state
    const [activePanel, setActivePanel] = useState(null);
    const [summaryMode, setSummaryMode] = useState('bullet');
    const [targetLang, setTargetLang] = useState(language || 'Hindi');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [speaking, setSpeaking] = useState(false);

    // Track if auto-processing has already fired
    const hasAutoProcessed = useRef(false);

    // Load article from sessionStorage and auto-process if it's a custom input
    useEffect(() => {
        const stored = sessionStorage.getItem('selectedArticle');
        if (stored) {
            const parsed = JSON.parse(stored);
            setArticle(parsed);

            // Get preferred language from sessionStorage
            const savedLang = sessionStorage.getItem('preferredLanguage');
            if (savedLang) setTargetLang(savedLang);

            if (parsed.customInput && !hasAutoProcessed.current) {
                hasAutoProcessed.current = true;
                if (parsed.inputUrl) {
                    // URL input → scrape then translate
                    autoScrapeAndTranslate(parsed, savedLang || targetLang);
                } else if (parsed.content) {
                    // Text input → set content and auto-translate
                    setDisplayedContent(parsed.content);
                    autoTranslate(parsed.content, savedLang || targetLang);
                }
            } else {
                setDisplayedContent(parsed.content || parsed.description || '');
            }
        }
    }, []);

    /**
     * Auto scrape a URL, update article, then translate.
     */
    async function autoScrapeAndTranslate(articleData, lang) {
        setScraping(true);
        setScrapeStatus('Connecting to source...');
        setError('');

        try {
            setScrapeStatus('Fetching article page...');
            await delay(300); // small UX delay for visual feedback

            setScrapeStatus('Extracting article content...');
            const scraped = await scrapeArticle(articleData.inputUrl);

            // Update article with scraped data
            const updatedArticle = {
                ...articleData,
                title: scraped.title || articleData.title,
                content: scraped.content,
                source: { name: scraped.source || articleData.source?.name },
                urlToImage: scraped.image || articleData.urlToImage,
            };

            setArticle(updatedArticle);
            setDisplayedContent(scraped.content);
            sessionStorage.setItem('selectedArticle', JSON.stringify(updatedArticle));

            setScraping(false);
            setScrapeStatus('');

            // Auto-translate the scraped content
            if (lang && lang !== 'English') {
                autoTranslate(scraped.content, lang);
            }
        } catch (err) {
            setScraping(false);
            setScrapeStatus('');
            setError('⚠ Scraping failed: ' + err.message);
        }
    }

    /**
     * Auto-translate content into the preferred language.
     */
    async function autoTranslate(text, lang) {
        if (!text || lang === 'English') return;

        setActivePanel('translate');
        setLoading(true);
        setError('');

        try {
            const result = await translateArticle(text, lang);
            setTranslatedText(result);
        } catch (err) {
            if (err.message === 'GEMINI_API_KEY_NOT_SET') {
                setError('⚠ Gemini API key not configured. Add your key to the .env file.');
            } else {
                setError('Translation failed: ' + err.message);
            }
        } finally {
            setLoading(false);
        }
    }

    const getArticleText = () => {
        return article?.content || article?.description || '';
    };

    async function handleTranslate() {
        setActivePanel('translate');
        setError('');
        setLoading(true);
        try {
            const result = await translateArticle(getArticleText(), targetLang);
            setTranslatedText(result);
        } catch (err) {
            if (err.message === 'GEMINI_API_KEY_NOT_SET') {
                setError('⚠ Gemini API key not configured. Add your key to the .env file.');
            } else {
                setError('Failed to translate. ' + err.message);
            }
        } finally {
            setLoading(false);
        }
    }

    async function handleSummarize(mode = summaryMode) {
        setActivePanel('summarize');
        setSummaryMode(mode);
        setError('');
        setLoading(true);
        try {
            const result = await summarizeArticle(getArticleText(), mode, targetLang);
            setSummary(result);
        } catch (err) {
            if (err.message === 'GEMINI_API_KEY_NOT_SET') {
                setError('⚠ Gemini API key not configured. Add your key to the .env file.');
            } else {
                setError('Failed to summarize. ' + err.message);
            }
        } finally {
            setLoading(false);
        }
    }

    async function handleSimplify() {
        setActivePanel('simplify');
        setError('');
        setLoading(true);
        try {
            const result = await simplifyArticle(getArticleText(), targetLang);
            setSimplified(result);
        } catch (err) {
            if (err.message === 'GEMINI_API_KEY_NOT_SET') {
                setError('⚠ Gemini API key not configured. Add your key to the .env file.');
            } else {
                setError('Failed to simplify. ' + err.message);
            }
        } finally {
            setLoading(false);
        }
    }



    function handlePlayAudio() {
        if (isSpeaking()) {
            stop();
            setSpeaking(false);
            return;
        }

        const textToSpeak = summary || translatedText || simplified || getArticleText();
        if (!textToSpeak) return;

        setSpeaking(true);
        speak(textToSpeak, getLangCode(targetLang), () => setSpeaking(false));
    }

    if (!article) {
        return (
            <div className="article-page">
                <div className="container">
                    <div className="empty-state">
                        <div className="empty-state__icon">📰</div>
                        <p className="empty-state__text">No article selected. Go back and pick one.</p>
                        <button
                            className="toolbar__btn"
                            onClick={() => navigate('/')}
                            style={{ marginTop: '20px', display: 'inline-flex' }}
                        >
                            ← Back to Home
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const formatDate = (dateStr) => {
        try {
            return new Date(dateStr).toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
                year: 'numeric'
            });
        } catch {
            return '';
        }
    };

    return (
        <div className="article-page" id="article-page">
            <div className="container">
                {/* Back button */}
                <button
                    className="article-page__back"
                    onClick={() => navigate('/')}
                    id="back-btn"
                >
                    ← back_to_feed
                </button>

                {/* Article Header */}
                <header className="article-page__header">
                    <div className="article-page__source">
                        {article.source?.name || 'Source'}
                    </div>
                    <h1 className="article-page__title">{article.title}</h1>
                    <div className="article-page__date">
                        {formatDate(article.publishedAt)}
                    </div>
                    {article.inputUrl && (
                        <a
                            href={article.inputUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="article-page__original-link"
                        >
                            🔗 View Original
                        </a>
                    )}
                </header>

                {/* Scraping Progress */}
                {scraping && (
                    <div className="scrape-progress" id="scrape-progress">
                        <div className="scrape-progress__bar">
                            <div className="scrape-progress__fill"></div>
                        </div>
                        <div className="scrape-progress__status">
                            <span className="scrape-progress__icon">⟳</span>
                            {scrapeStatus}
                        </div>
                        <div className="scrape-progress__terminal">
                            <span className="scrape-progress__prompt">&gt; </span>
                            <span className="scrape-progress__text">
                                scraping {article.inputUrl?.substring(0, 50)}...
                            </span>
                            <span className="hero__cursor"></span>
                        </div>
                    </div>
                )}

                {/* Original Article Content */}
                {!scraping && displayedContent && (
                    <div className="article-page__content" id="article-content">
                        {displayedContent.split('\n\n').map((paragraph, i) => (
                            <p key={i} style={{ marginBottom: '12px' }}>{paragraph}</p>
                        ))}
                    </div>
                )}

                {/* Toolbar — only show after content is available */}
                {!scraping && displayedContent && (
                    <div className="toolbar" id="article-toolbar">
                        {(article.inputUrl || article.url) && (
                            <>
                                <a
                                    className="toolbar__btn toolbar__btn--cyan"
                                    href={article.inputUrl || article.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    id="read-original-btn"
                                    style={{ textDecoration: 'none' }}
                                >
                                    🔗 Read Original
                                </a>
                                <div className="toolbar__separator"></div>
                            </>
                        )}
                        <button
                            className={`toolbar__btn ${activePanel === 'translate' ? 'toolbar__btn--active' : ''}`}
                            onClick={handleTranslate}
                            id="translate-btn"
                        >
                            🌐 Translate
                        </button>

                        <button
                            className={`toolbar__btn ${activePanel === 'summarize' ? 'toolbar__btn--active' : ''}`}
                            onClick={() => handleSummarize()}
                            id="summarize-btn"
                        >
                            📝 Summarize
                        </button>

                        <button
                            className={`toolbar__btn ${activePanel === 'simplify' ? 'toolbar__btn--active' : ''}`}
                            onClick={handleSimplify}
                            id="simplify-btn"
                        >
                            ✨ Simplify
                        </button>



                        <div className="toolbar__separator"></div>

                        <button
                            className={`toolbar__btn toolbar__btn--amber ${speaking ? 'toolbar__btn--active' : ''}`}
                            onClick={handlePlayAudio}
                            id="audio-btn"
                        >
                            {speaking ? '⏹ Stop' : '🔊 Listen'}
                        </button>

                        <div className="toolbar__lang-select">
                            <select
                                className="lang-selector"
                                value={targetLang}
                                onChange={(e) => setTargetLang(e.target.value)}
                                id="article-language-selector"
                            >
                                {LANGUAGES.map(lang => (
                                    <option key={lang} value={lang}>{lang}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                )}

                {/* Audio Player Status */}
                {speaking && (
                    <div className="audio-player" id="audio-player">
                        <button className="audio-player__btn" onClick={handlePlayAudio}>
                            ⏹
                        </button>
                        <span className="audio-player__label">Now playing audio summary</span>
                        <span className="audio-player__status">▶ PLAYING...</span>
                    </div>
                )}

                {/* Loading State */}
                {loading && (
                    <div className="loader">
                        <div className="loader__spinner"></div>
                        <div className="loader__text">Processing...</div>
                    </div>
                )}

                {/* Error */}
                {error && (
                    <div className="results-panel" style={{ borderColor: 'var(--red)' }}>
                        <div className="results-panel__content" style={{ color: 'var(--red)' }}>
                            {error}
                        </div>
                    </div>
                )}

                {/* Translation Result */}
                {activePanel === 'translate' && translatedText && !loading && (
                    <div className="results-panel" id="translation-result">
                        <div className="results-panel__header">
                            <span className="results-panel__title">🌐 Translation — {targetLang}</span>
                        </div>
                        <div className="results-panel__content">
                            {translatedText.split('\n\n').map((paragraph, i) => (
                                <p key={i} style={{ marginBottom: '10px' }}>{paragraph}</p>
                            ))}
                        </div>
                    </div>
                )}

                {/* Summary Result */}
                {activePanel === 'summarize' && !loading && (
                    <>
                        <div className="summary-modes">
                            {['bullet', 'paragraph', 'quick'].map(mode => (
                                <button
                                    key={mode}
                                    className={`summary-modes__btn ${summaryMode === mode ? 'summary-modes__btn--active' : ''}`}
                                    onClick={() => handleSummarize(mode)}
                                >
                                    {mode === 'bullet' ? '• Bullets' : mode === 'paragraph' ? '¶ Paragraph' : '⚡ 30-sec'}
                                </button>
                            ))}
                        </div>
                        {summary && (
                            <div className="results-panel" id="summary-result">
                                <div className="results-panel__header">
                                    <span className="results-panel__title">
                                        📝 Summary — {summaryMode}
                                    </span>
                                </div>
                                <div className="results-panel__content">
                                    {summaryMode === 'bullet' ? (
                                        <ul>
                                            {summary.split('\n').filter(l => l.trim()).map((line, i) => (
                                                <li key={i}>{line.replace(/^[•\-\*]\s*/, '')}</li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <p>{summary}</p>
                                    )}
                                </div>
                            </div>
                        )}
                    </>
                )}

                {/* Simplified Result */}
                {activePanel === 'simplify' && simplified && !loading && (
                    <div className="results-panel" id="simplified-result">
                        <div className="results-panel__header">
                            <span className="results-panel__title">✨ Simplified Version</span>
                        </div>
                        <div className="results-panel__content">
                            {simplified}
                        </div>
                    </div>
                )}


            </div>
        </div>
    );
}

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
