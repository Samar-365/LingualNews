import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';



const CONTINENTS = [
    { id: 'all', label: 'All Continents' },
    { id: 'north_america', label: 'North America' },
    { id: 'europe', label: 'Europe' },
    { id: 'asia', label: 'Asia' },
    { id: 'oceania', label: 'Oceania' },
    { id: 'africa', label: 'Africa' },
    { id: 'south_america', label: 'South America' }
];

export default function Navbar({ language, onLanguageChange, continent, onContinentChange }) {
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
                        <div className="navbar__filter">
                            <select
                                className="navbar__select"
                                value={continent}
                                onChange={(e) => onContinentChange(e.target.value)}
                                id="continent-filter"
                                aria-label="Filter by continent"
                            >
                                {CONTINENTS.map(c => (
                                    <option key={c.id} value={c.id}>{c.label}</option>
                                ))}
                            </select>
                        </div>
                    </li>
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
