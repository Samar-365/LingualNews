import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    translateArticle,
    summarizeArticle,
    simplifyArticle,
    extractKeyInfo
} from '../services/aiService';
import { speak, stop, isSpeaking, getLangCode } from '../services/ttsService';

const LANGUAGES = ['English', 'Hindi', 'Spanish', 'Marathi', 'French'];

export default function ArticlePage({ language }) {
    const navigate = useNavigate();
    const [article, setArticle] = useState(null);
    const [displayedContent, setDisplayedContent] = useState('');

    // AI results
    const [translatedText, setTranslatedText] = useState('');
    const [summary, setSummary] = useState('');
    const [simplified, setSimplified] = useState('');
    const [keyInfo, setKeyInfo] = useState(null);

    // UI state
    const [activePanel, setActivePanel] = useState(null); // 'translate','summarize','simplify','extract'
    const [summaryMode, setSummaryMode] = useState('bullet');
    const [targetLang, setTargetLang] = useState(language || 'Hindi');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [speaking, setSpeaking] = useState(false);

    useEffect(() => {
        const stored = sessionStorage.getItem('selectedArticle');
        if (stored) {
            const parsed = JSON.parse(stored);
            setArticle(parsed);
            setDisplayedContent(parsed.content || parsed.description || '');
        }
    }, []);

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
            const result = await summarizeArticle(getArticleText(), mode);
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
            const result = await simplifyArticle(getArticleText());
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

    async function handleExtractKeyInfo() {
        setActivePanel('extract');
        setError('');
        setLoading(true);
        try {
            const result = await extractKeyInfo(getArticleText());
            setKeyInfo(result);
        } catch (err) {
            if (err.message === 'GEMINI_API_KEY_NOT_SET') {
                setError('⚠ Gemini API key not configured. Add your key to the .env file.');
            } else {
                setError('Failed to extract key info. ' + err.message);
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
                </header>

                {/* Original Article Content */}
                <div className="article-page__content" id="article-content">
                    {displayedContent || 'No content available for this article.'}
                </div>

                {/* Toolbar */}
                <div className="toolbar" id="article-toolbar">
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

                    <button
                        className={`toolbar__btn ${activePanel === 'extract' ? 'toolbar__btn--active' : ''}`}
                        onClick={handleExtractKeyInfo}
                        id="extract-btn"
                    >
                        🔍 Key Info
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
                        <div className="loader__text">Processing with AI...</div>
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
                            {translatedText}
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

                {/* Key Info Result */}
                {activePanel === 'extract' && keyInfo && !loading && (
                    <div className="results-panel" id="keyinfo-result">
                        <div className="results-panel__header">
                            <span className="results-panel__title">🔍 Key Information</span>
                        </div>
                        <div className="key-info">
                            {Object.entries(keyInfo).map(([key, value]) => (
                                <div className="key-info__item" key={key}>
                                    <div className="key-info__label">{key}</div>
                                    <div className="key-info__value">{value}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
