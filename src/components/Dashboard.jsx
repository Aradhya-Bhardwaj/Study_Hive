import React from 'react';
import { useAuth } from '../context/AuthContext';
import { osSubject } from '../data/subjects/os';
import { networkingSubject } from '../data/subjects/networking';
import { dbmsSubject } from '../data/subjects/dbms';
import { oopSubject } from '../data/subjects/oop';
import { coaSubject } from '../data/subjects/coa';

export default function Dashboard({ progress = {}, bookmarks = [], onNavigateToSection, onRemoveBookmark }) {
  const { user } = useAuth();
  const subjects = [osSubject, networkingSubject, dbmsSubject, oopSubject, coaSubject];

  // Helper to count total sections in a subject
  const getSubjectMetrics = (subject) => {
    let total = 0;
    let completed = 0;
    subject.chapters.forEach(ch => {
      ch.sections.forEach(sec => {
        total++;
        if (progress[sec.id]) {
          completed++;
        }
      });
    });
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, completed, percent };
  };

  // Compute metrics for all subjects
  const osMetrics = getSubjectMetrics(osSubject);
  const networkingMetrics = getSubjectMetrics(networkingSubject);
  const dbmsMetrics = getSubjectMetrics(dbmsSubject);
  const oopMetrics = getSubjectMetrics(oopSubject);
  const coaMetrics = getSubjectMetrics(coaSubject);

  const totalSections = osMetrics.total + networkingMetrics.total + dbmsMetrics.total + oopMetrics.total + coaMetrics.total;
  const completedSections = osMetrics.completed + networkingMetrics.completed + dbmsMetrics.completed + oopMetrics.completed + coaMetrics.completed;
  const overallPercent = totalSections > 0 ? Math.round((completedSections / totalSections) * 100) : 0;

  const handleSubjectClick = (subjectId) => {
    const subject = subjects.find(s => s.id === subjectId);
    if (subject && subject.chapters.length > 0 && subject.chapters[0].sections.length > 0) {
      onNavigateToSection(subjectId, subject.chapters[0].id, subject.chapters[0].sections[0].id);
    }
  };

  const getSubjectIcon = (id) => {
    switch (id) {
      case 'os':
        return (
          <svg className="subject-card-icon" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#fbbf24' }}>
            <rect x="4" y="4" width="16" height="16" rx="2" ry="2"></rect>
            <rect x="9" y="9" width="6" height="6"></rect>
            <line x1="9" y1="1" x2="9" y2="4"></line>
            <line x1="15" y1="1" x2="15" y2="4"></line>
            <line x1="9" y1="20" x2="9" y2="23"></line>
            <line x1="15" y1="20" x2="15" y2="23"></line>
            <line x1="20" y1="9" x2="23" y2="9"></line>
            <line x1="20" y1="15" x2="23" y2="15"></line>
            <line x1="1" y1="9" x2="4" y2="9"></line>
            <line x1="1" y1="15" x2="4" y2="15"></line>
          </svg>
        );
      case 'networking':
        return (
          <svg className="subject-card-icon" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#38bdf8' }}>
            <circle cx="18" cy="5" r="3"></circle>
            <circle cx="6" cy="12" r="3"></circle>
            <circle cx="18" cy="19" r="3"></circle>
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
          </svg>
        );
      case 'dbms':
        return (
          <svg className="subject-card-icon" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#34d399' }}>
            <ellipse cx="12" cy="5" rx="9" ry="3"></ellipse>
            <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path>
            <path d="M3 12c0 1.66 4 3 9 3s9-1.34 9-3"></path>
          </svg>
        );
      case 'oop':
        return (
          <svg className="subject-card-icon" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#c084fc' }}>
            <polyline points="16 18 22 12 16 6"></polyline>
            <polyline points="8 6 2 12 8 18"></polyline>
            <line x1="14" y1="4" x2="10" y2="20"></line>
          </svg>
        );
      case 'coa':
        return (
          <svg className="subject-card-icon" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#f87171' }}>
            <rect x="2" y="2" width="20" height="8" rx="2" ry="2"></rect>
            <rect x="2" y="14" width="20" height="8" rx="2" ry="2"></rect>
            <line x1="6" y1="6" x2="6.01" y2="6"></line>
            <line x1="10" y1="6" x2="10.01" y2="6"></line>
            <line x1="6" y1="18" x2="6.01" y2="18"></line>
            <line x1="10" y1="18" x2="10.01" y2="18"></line>
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div className="dashboard-container">
      {/* Header */}
      <div className="dashboard-header">
        <div className="dashboard-eyebrow">StudyHive</div>
        <h2 className="dashboard-welcome">
          Welcome back, <span>{user?.username || 'Learner'}</span>
        </h2>
        <p className="dashboard-subtitle">Pick up where you left off and continue mastering Computer Science.</p>
      </div>

      {/* Stats Dashboard Grid */}
      <div className="stats-grid">
        <div className="stat-card glass">
          <div className="stat-icon-wrapper" style={{ background: 'var(--accent-primary-glow)', color: 'var(--accent-primary)' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
            </svg>
          </div>
          <div className="stat-info">
            <span className="stat-value">{overallPercent}%</span>
            <span className="stat-label">Total Progress</span>
          </div>
        </div>

        <div className="stat-card glass">
          <div className="stat-icon-wrapper" style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--accent-success)' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
            </svg>
          </div>
          <div className="stat-info">
            <span className="stat-value">{completedSections} / {totalSections}</span>
            <span className="stat-label">Topics Completed</span>
          </div>
        </div>

        <div className="stat-card glass">
          <div className="stat-icon-wrapper" style={{ background: 'rgba(245, 158, 11, 0.1)', color: 'var(--accent-warning)' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
            </svg>
          </div>
          <div className="stat-info">
            <span className="stat-value">{bookmarks.length}</span>
            <span className="stat-label">Bookmarks Saved</span>
          </div>
        </div>
      </div>

      {/* Course Cards Grid */}
      <h3 className="subjects-section-title">Your Study Subjects</h3>
      <div className="subjects-grid">
        {subjects.map((sub) => {
          const metrics = getSubjectMetrics(sub);
          return (
            <div 
              key={sub.id} 
              className={`subject-card glass ${sub.id}`}
              onClick={() => handleSubjectClick(sub.id)}
            >
              <div className="subject-card-body">
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                  {getSubjectIcon(sub.id)}
                  <h3 style={{ margin: 0, fontSize: '1.25rem' }}>{sub.title}</h3>
                </div>
                <p>{sub.description}</p>
              </div>

              <div className="subject-card-footer">
                <div className="subject-progress-container">
                  <div className="subject-progress-text">
                    <span>Progress</span>
                    <span>{metrics.percent}%</span>
                  </div>
                  <div className="subject-progress-bar">
                    <div 
                      className="subject-progress-fill" 
                      style={{ width: `${metrics.percent}%` }}
                    ></div>
                  </div>
                </div>
                <button className="btn btn-primary" style={{ padding: '8px 12px', fontSize: '0.82rem', height: '36px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  Study
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                    <polyline points="12 5 19 12 12 19"></polyline>
                  </svg>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bookmarks Section */}
      {bookmarks.length > 0 && (
        <div className="bookmarks-section">
          <h3 className="subjects-section-title">Saved Bookmarks</h3>
          <div className="bookmarks-grid">
            {bookmarks.map((bm, index) => (
              <div 
                key={`${bm.sectionId}-${index}`} 
                className="bookmark-card glass"
                onClick={() => onNavigateToSection(bm.subjectId, bm.chapterId, bm.sectionId)}
              >
                <div className="bookmark-info">
                  <span className={`bookmark-subject ${bm.subjectId}`}>
                    {bm.subjectId.toUpperCase()}
                  </span>
                  <span className="bookmark-title">{bm.sectionTitle}</span>
                </div>
                <button 
                  className="bookmark-remove-btn"
                  onClick={(e) => {
                    e.stopPropagation(); // prevent card click navigation
                    onRemoveBookmark(bm.sectionId);
                  }}
                  title="Remove Bookmark"
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    <line x1="10" y1="11" x2="10" y2="17"></line>
                    <line x1="14" y1="11" x2="14" y2="17"></line>
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
