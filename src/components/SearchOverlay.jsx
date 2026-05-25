import React from 'react';

export default function SearchOverlay({ results, query, onResultClick }) {
  const highlightText = (text, q) => {
    if (!q) return text;
    const regex = new RegExp(`(${q.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    return (
      <>
        {parts.map((part, i) => 
          part.toLowerCase() === q.toLowerCase() 
            ? <mark key={i}>{part}</mark> 
            : part
        )}
      </>
    );
  };

  const getSnippet = (content, q) => {
    const cleanContent = content.replace(/[#*`_]/g, ''); // strip markdown chars
    const index = cleanContent.toLowerCase().indexOf(q.toLowerCase());
    if (index === -1) {
      return cleanContent.substring(0, 100) + '...';
    }
    const start = Math.max(0, index - 40);
    const end = Math.min(cleanContent.length, index + q.length + 60);
    let prefix = start > 0 ? '...' : '';
    let suffix = end < cleanContent.length ? '...' : '';
    return prefix + cleanContent.substring(start, end) + suffix;
  };

  return (
    <div className="search-results-overlay glass">
      <div className="search-results-header">Search Results</div>
      {results.length > 0 ? (
        results.map((res) => (
          <div 
            key={res.section.id} 
            className="search-result-item" 
            onClick={() => onResultClick(res.subjectId, res.chapterId, res.section.id)}
          >
            <div className="search-result-title-bar">
              <span className="search-result-title">
                {highlightText(res.section.title, query)}
              </span>
              <span className={`search-result-badge ${res.subjectId}`}>
                {res.subjectTitle}
              </span>
            </div>
            <p className="search-result-snippet">
              {highlightText(getSnippet(res.section.content, query), query)}
            </p>
          </div>
        ))
      ) : (
        <div className="search-no-results">No topics found matching "{query}"</div>
      )}
    </div>
  );
}
