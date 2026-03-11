import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

const LANGUAGES = ['English', 'Hindi', 'Spanish', 'Marathi', 'French'];

export default function Navbar({ language, onLanguageChange }) {
    const [menuOpen, setMenuOpen] = useState(false);
    const location = useLocation();

    return (
        <nav className="navbar" id="navbar">
            <div className="container">
                <a href="/" className="navbar__logo">
                    <span className="navbar__logo-icon">⬡</span>
                    <span>LINGUAL<span style={{ color: 'var(--amber)' }}>NEWS</span></span>
                </a>

                <button
                    className="mobile-menu-btn"
                    onClick={() => setMenuOpen(!menuOpen)}
                    aria-label="Toggle menu"
                >
                    {menuOpen ? '✕' : '☰'}
                </button>

                <ul className={`navbar__links ${menuOpen ? 'navbar__links--open' : ''}`}>
                    <li>
                        <a
                            href="/"
                            className={location.pathname === '/' ? 'active' : ''}
                            onClick={() => setMenuOpen(false)}
                        >
                            Home
                        </a>
                    </li>

                </ul>
            </div>
        </nav>
    );
}
