import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

const LANGUAGES = ['English', 'Hindi', 'Spanish', 'Marathi', 'French'];

export default function Navbar({ language, onLanguageChange }) {
    const [menuOpen, setMenuOpen] = useState(false);
    const location = useLocation();

    return (
        <nav className="navbar" id="navbar">
            <div className="container">
                <Link to="/" className="navbar__logo">
                    <span className="navbar__logo-icon">⬡</span>
                    <span>LINGUAL<span style={{ color: 'var(--amber)' }}>NEWS</span></span>
                </Link>

                <button
                    className="mobile-menu-btn"
                    onClick={() => setMenuOpen(!menuOpen)}
                    aria-label="Toggle menu"
                >
                    {menuOpen ? '✕' : '☰'}
                </button>

                <ul className={`navbar__links ${menuOpen ? 'navbar__links--open' : ''}`}>
                    <li>
                        <Link
                            to="/"
                            className={location.pathname === '/' ? 'active' : ''}
                            onClick={() => setMenuOpen(false)}
                        >
                            Home
                        </Link>
                    </li>
                    <li>
                        <select
                            className="lang-selector"
                            value={language}
                            onChange={(e) => onLanguageChange(e.target.value)}
                            id="global-language-selector"
                        >
                            {LANGUAGES.map(lang => (
                                <option key={lang} value={lang}>{lang}</option>
                            ))}
                        </select>
                    </li>
                </ul>
            </div>
        </nav>
    );
}
