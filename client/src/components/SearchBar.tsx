import { useState, useEffect } from 'react';
import './SearchBar.css';

interface SearchBarProps {
  onSearch: (query: string) => void;
  onStatusFilter: (status: string) => void;
  onScrape: () => void;
  isScraping: boolean;
}

export default function SearchBar({ onSearch, onStatusFilter, onScrape, isScraping }: SearchBarProps) {
  const [query, setQuery] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => onSearch(query), 300);
    return () => clearTimeout(timer);
  }, [query, onSearch]);

  return (
    <div className="search-bar">
      <div className="search-bar__input-wrapper">
        <span className="search-bar__icon">&#128269;</span>
        <input
          type="text"
          className="search-bar__input"
          placeholder="Search by title, location, or department..."
          value={query}
          onChange={e => setQuery(e.target.value)}
        />
        {query && (
          <button className="search-bar__clear" onClick={() => setQuery('')}>&#10005;</button>
        )}
      </div>
      <select
        className="search-bar__select"
        onChange={e => onStatusFilter(e.target.value)}
        defaultValue="all"
      >
        <option value="all">All Statuses</option>
        <option value="not_applied">Not Applied</option>
        <option value="in_progress">In Progress</option>
        <option value="form_filled">Form Filled</option>
        <option value="review_page_reached">Review Reached</option>
        <option value="screenshot_captured">Completed</option>
        <option value="failed">Failed</option>
      </select>
      <button
        className="search-bar__scrape-btn"
        onClick={onScrape}
        disabled={isScraping}
      >
        {isScraping ? (
          <><span className="search-bar__spinner"></span> Scraping...</>
        ) : (
          'Scrape Jobs'
        )}
      </button>
    </div>
  );
}
