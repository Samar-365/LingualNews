export default function NewsCard({ article, index, onClick }) {
    const formatDate = (dateStr) => {
        try {
            return new Date(dateStr).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
            });
        } catch {
            return 'Unknown';
        }
    };

    return (
        <div
            className="news-card"
            onClick={() => onClick(article, index)}
            style={{ animationDelay: `${index * 0.1}s` }}
            id={`news-card-${index}`}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && onClick(article, index)}
        >
            {article.urlToImage && (
                <img
                    className="news-card__image"
                    src={article.urlToImage}
                    alt={article.title}
                    loading="lazy"
                    onError={(e) => { e.target.style.display = 'none'; }}
                />
            )}
            <div className="news-card__source">
                {article.source?.name || 'Unknown Source'}
            </div>
            <h3 className="news-card__title">{article.title}</h3>
            <p className="news-card__desc">{article.description}</p>
            <div className="news-card__meta">
                <span className="news-card__date">{formatDate(article.publishedAt)}</span>
                <span className="news-card__read-more">{'[ ANALYZE → ]'}</span>
            </div>
        </div>
    );
}
