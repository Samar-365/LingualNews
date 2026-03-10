import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import ArticlePage from './pages/ArticlePage';

export default function App() {
    const [language, setLanguage] = useState('English');

    return (
        <Router>
            <Navbar language={language} onLanguageChange={setLanguage} />
            <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/article/:id" element={<ArticlePage language={language} />} />
            </Routes>
            <Footer />
        </Router>
    );
}
