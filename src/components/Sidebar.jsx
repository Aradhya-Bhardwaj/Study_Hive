import React from 'react';

export default function Sidebar({ subject, activeSectionId, onSelectSection, onGoBack, collapsed, setCollapsed }) {
  if (!subject) return null;

  return (
    <div className={`sidebar-container ${collapsed ? 'collapsed' : ''}`}>
      {/* ── Header row: back button + collapse toggle ── */}
      <div className="sidebar-header">
        <button
          onClick={onGoBack}
          className="btn btn-ghost"
          style={{ padding: '6px 10px', fontSize: '0.8rem', height: '32px', gap: '6px' }}
          title="Back to Dashboard"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"/>
            <polyline points="12 19 5 12 12 5"/>
          </svg>
          Dashboard
        </button>

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="theme-btn"
          style={{ width: '32px', height: '32px', borderRadius: 'var(--radius-sm)' }}
          title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {collapsed ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
          )}
        </button>
      </div>

      {/* ── Subject Meta ── */}
      <div className="sidebar-meta">
        <div className="sidebar-subject-label">Course Roadmap</div>
        <div className="sidebar-title">{subject.title}</div>
      </div>

      {/* ── Chapter + Section List ── */}
      <div className="sidebar-content">
        {subject.chapters.map((chapter) => (
          <div key={chapter.id} className="sidebar-chapter-group">
            <div className="sidebar-chapter-title">{chapter.title}</div>
            {chapter.sections.map((section) => (
              <a
                key={section.id}
                href={`#${section.id}`}
                className={`sidebar-topic-item ${activeSectionId === section.id ? 'active' : ''}`}
                onClick={(e) => {
                  e.preventDefault();
                  onSelectSection(chapter.id, section.id);
                }}
              >
                <span className="sidebar-dot" />
                <span>{section.title}</span>
              </a>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
