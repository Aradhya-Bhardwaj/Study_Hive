import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { osSubject } from '../data/subjects/os';
import { networkingSubject } from '../data/subjects/networking';
import { dbmsSubject } from '../data/subjects/dbms';
import { oopSubject } from '../data/subjects/oop';
import { coaSubject } from '../data/subjects/coa';
import SearchOverlay from './SearchOverlay';

export default function Navbar({ onNavigate, onNavigateToSection }) {
  const { user, logout } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [themeDropdownOpen, setThemeDropdownOpen] = useState(false);
  const [currentTheme, setCurrentTheme] = useState('dark'); // 'dark' (default), 'light', 'sepia'
  
  const themeRef = useRef(null);
  const searchRef = useRef(null);

  // Initialize theme from localStorage/system preferences
  useEffect(() => {
    const savedTheme = localStorage.getItem('studyhive_theme') || 'dark';
    changeTheme(savedTheme);
  }, []);

  // Handle click outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (themeRef.current && !themeRef.current.contains(event.target)) {
        setThemeDropdownOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setSearchQuery('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Full-text search matching logic
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const q = searchQuery.toLowerCase();
    const matches = [];
    const subjects = [osSubject, networkingSubject, dbmsSubject, oopSubject, coaSubject];

    subjects.forEach(subject => {
      subject.chapters.forEach(chapter => {
        chapter.sections.forEach(section => {
          const titleMatch = section.title.toLowerCase().includes(q);
          const contentMatch = section.content.toLowerCase().includes(q);
          if (titleMatch || contentMatch) {
            matches.push({
              subjectId: subject.id,
              subjectTitle: subject.title,
              chapterId: chapter.id,
              chapterTitle: chapter.title,
              section: section
            });
          }
        });
      });
    });

    setSearchResults(matches);
  }, [searchQuery]);

  const changeTheme = (theme) => {
    setCurrentTheme(theme);
    localStorage.setItem('studyhive_theme', theme);
    if (theme === 'dark') {
      document.documentElement.removeAttribute('data-theme');
    } else {
      document.documentElement.setAttribute('data-theme', theme);
    }
  };

  const handleSearchResultClick = (subjectId, chapterId, sectionId) => {
    setSearchQuery('');
    if (onNavigateToSection) {
      onNavigateToSection(subjectId, chapterId, sectionId);
    }
  };

  return (
    <nav className="navbar">
      <div className="nav-left">
        <a 
          href="#dashboard" 
          className="nav-brand" 
          onClick={(e) => {
            e.preventDefault();
            onNavigate('dashboard');
          }}
        >
          <svg className="logo-svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent-primary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2L2 7l10 5 10-5-10-5z" />
            <path d="M2 17l10 5 10-5" />
            <path d="M2 12l10 5 10-5" />
          </svg>
          <span className="nav-brand-text">StudyHive</span>
        </a>
      </div>

      <div className="nav-center" ref={searchRef}>
        <div className="nav-search-wrapper">
          <span className="nav-search-icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
          </span>
          <input 
            type="text" 
            placeholder="Search for a computer science topic..." 
            className="nav-search-input input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        {searchQuery && (
          <SearchOverlay 
            results={searchResults} 
            query={searchQuery} 
            onResultClick={handleSearchResultClick}
          />
        )}
      </div>

      <div className="nav-right">
        {/* Theme Selector */}
        <div className="theme-selector" ref={themeRef}>
          <button 
            onClick={() => setThemeDropdownOpen(!themeDropdownOpen)} 
            className="theme-btn"
            title="Switch Theme"
          >
            {currentTheme === 'dark' ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
              </svg>
            ) : currentTheme === 'light' ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="5"></circle>
                <line x1="12" y1="1" x2="12" y2="3"></line>
                <line x1="12" y1="21" x2="12" y2="23"></line>
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                <line x1="1" y1="12" x2="3" y2="12"></line>
                <line x1="21" y1="12" x2="23" y2="12"></line>
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
              </svg>
            )}
          </button>
          
          {themeDropdownOpen && (
            <div className="theme-dropdown">
              <div 
                className={`theme-option ${currentTheme === 'dark' ? 'active' : ''}`}
                onClick={() => { changeTheme('dark'); setThemeDropdownOpen(false); }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
                </svg>
                <span>Dark</span>
              </div>
              <div 
                className={`theme-option ${currentTheme === 'light' ? 'active' : ''}`}
                onClick={() => { changeTheme('light'); setThemeDropdownOpen(false); }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="5"></circle>
                  <line x1="12" y1="1" x2="12" y2="3"></line>
                  <line x1="12" y1="21" x2="12" y2="23"></line>
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                  <line x1="1" y1="12" x2="3" y2="12"></line>
                  <line x1="21" y1="12" x2="23" y2="12"></line>
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
                </svg>
                <span>Light</span>
              </div>
              <div 
                className={`theme-option ${currentTheme === 'sepia' ? 'active' : ''}`}
                onClick={() => { changeTheme('sepia'); setThemeDropdownOpen(false); }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
                  <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
                </svg>
                <span>Sepia</span>
              </div>
            </div>
          )}
        </div>

        {/* User Info & Profile Widget */}
        {user && (
          <div className="profile-widget">
            <div className="profile-avatar">
              {user.username.charAt(0).toUpperCase()}
            </div>
            <span className="profile-username">{user.username}</span>
            <button onClick={logout} className="profile-logout-btn" title="Logout">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                <polyline points="16 17 21 12 16 7"></polyline>
                <line x1="21" y1="12" x2="9" y2="12"></line>
              </svg>
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
