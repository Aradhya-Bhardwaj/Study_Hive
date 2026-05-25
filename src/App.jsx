import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from './context/AuthContext';

// Subject Databases
import { osSubject } from './data/subjects/os';
import { networkingSubject } from './data/subjects/networking';
import { dbmsSubject } from './data/subjects/dbms';
import { oopSubject } from './data/subjects/oop';
import { coaSubject } from './data/subjects/coa';

// Global UI Components
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import QuizWidget from './components/QuizWidget';
import Login from './components/Login';

// Simulators
import CpuScheduler from './components/simulators/CpuScheduler';
import DiskScheduler from './components/simulators/DiskScheduler';
import SubnetCalculator from './components/simulators/SubnetCalculator';
import AmdahlCalculator from './components/simulators/AmdahlCalculator';


export default function App() {
  const { user, loading, updateUserMetrics } = useAuth();
  
  // Navigation State
  const [activePage, setActivePage] = useState('dashboard'); // 'dashboard' or 'subject'
  const [activeSubjectId, setActiveSubjectId] = useState(null);
  const [activeChapterId, setActiveChapterId] = useState(null);
  const [activeSectionId, setActiveSectionId] = useState(null);
  
  // User Progress and Bookmarks
  const [progress, setProgress] = useState({});
  const [bookmarks, setBookmarks] = useState([]);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const lastUsernameRef = useRef(null);

  // Load progress and bookmarks once user logs in
  useEffect(() => {
    if (user) {
      setProgress(user.progress || {});
      setBookmarks(user.bookmarks || []);
      
      // Default to dashboard only if the logged-in user changed
      if (lastUsernameRef.current !== user.username) {
        setActivePage('dashboard');
        lastUsernameRef.current = user.username;
      }
    } else {
      lastUsernameRef.current = null;
    }
  }, [user]);

  if (loading) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', background: '#0f172a', color: '#fff' }}>
        <div style={{ fontSize: '1.25rem', fontWeight: 600 }}>Loading StudyHive...</div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  // Find active subject database
  const getSubjectById = (id) => {
    if (id === 'os') return osSubject;
    if (id === 'networking') return networkingSubject;
    if (id === 'dbms') return dbmsSubject;
    if (id === 'oop') return oopSubject;
    if (id === 'coa') return coaSubject;
    return null;
  };

  const activeSubject = getSubjectById(activeSubjectId);
  
  // Find active section
  let activeSection = null;
  if (activeSubject) {
    const chapter = activeSubject.chapters.find(c => c.id === activeChapterId);
    if (chapter) {
      activeSection = chapter.sections.find(s => s.id === activeSectionId);
    }
  }

  // Navigation handlers
  const handleNavigate = (page) => {
    setActivePage(page);
    if (page === 'dashboard') {
      setActiveSubjectId(null);
      setActiveChapterId(null);
      setActiveSectionId(null);
    }
  };

  const handleNavigateToSection = (subjectId, chapterId, sectionId) => {
    setActiveSubjectId(subjectId);
    setActiveChapterId(chapterId);
    setActiveSectionId(sectionId);
    setActivePage('subject');
    
    // Auto scroll reader panel to the top on section change
    const readerEl = document.querySelector('.reader-container');
    if (readerEl) readerEl.scrollTop = 0;
  };

  const handleSelectSection = (chapterId, sectionId) => {
    setActiveChapterId(chapterId);
    setActiveSectionId(sectionId);
    
    const readerEl = document.querySelector('.reader-container');
    if (readerEl) readerEl.scrollTop = 0;
  };

  // Toggle Section Completion
  const handleToggleCompleted = () => {
    if (!activeSectionId) return;
    const newProgress = { ...progress, [activeSectionId]: !progress[activeSectionId] };
    setProgress(newProgress);
    updateUserMetrics(newProgress, bookmarks);
  };

  // Toggle Bookmark
  const handleToggleBookmark = () => {
    if (!activeSection || !activeSubjectId || !activeChapterId || !activeSectionId) return;
    
    const isBookmarked = bookmarks.some(bm => bm.sectionId === activeSectionId);
    let newBookmarks = [];
    
    if (isBookmarked) {
      newBookmarks = bookmarks.filter(bm => bm.sectionId !== activeSectionId);
    } else {
      newBookmarks = [
        ...bookmarks,
        {
          subjectId: activeSubjectId,
          chapterId: activeChapterId,
          sectionId: activeSectionId,
          sectionTitle: activeSection.title
        }
      ];
    }
    
    setBookmarks(newBookmarks);
    updateUserMetrics(progress, newBookmarks);
  };

  // Remove Bookmark from Dashboard directly
  const handleRemoveBookmark = (secId) => {
    const newBookmarks = bookmarks.filter(bm => bm.sectionId !== secId);
    setBookmarks(newBookmarks);
    updateUserMetrics(progress, newBookmarks);
  };

  // Next section calculation for footer pagination
  const getNextSection = () => {
    if (!activeSubject) return null;
    let found = false;
    for (let c = 0; c < activeSubject.chapters.length; c++) {
      const chapter = activeSubject.chapters[c];
      for (let s = 0; s < chapter.sections.length; s++) {
        const sec = chapter.sections[s];
        if (found) {
          return {
            chapterId: chapter.id,
            sectionId: sec.id,
            title: sec.title
          };
        }
        if (sec.id === activeSectionId) {
          found = true;
        }
      }
    }
    return null;
  };

  const nextSection = getNextSection();



  // Render active simulator
  const renderSimulator = (simName) => {
    switch (simName) {
      case 'cpu-scheduler':
        return <CpuScheduler />;
      case 'disk-scheduler':
        return <DiskScheduler />;
      case 'subnet-calculator':
        return <SubnetCalculator />;
      case 'amdahl-calculator':
        return <AmdahlCalculator />;

      default:
        return null;
    }
  };

  const isBookmarked = bookmarks.some(bm => bm.sectionId === activeSectionId);

  return (
    <>
      <Navbar onNavigate={handleNavigate} onNavigateToSection={handleNavigateToSection} />
      
      {activePage === 'dashboard' ? (
        <Dashboard 
          progress={progress} 
          bookmarks={bookmarks} 
          onNavigateToSection={handleNavigateToSection} 
          onRemoveBookmark={handleRemoveBookmark}
        />
      ) : (
        <div className="subject-viewer-layout">
          <Sidebar 
            subject={activeSubject}
            activeSectionId={activeSectionId}
            onSelectSection={handleSelectSection}
            onGoBack={() => handleNavigate('dashboard')}
            collapsed={sidebarCollapsed}
            setCollapsed={setSidebarCollapsed}
          />
          
          {sidebarCollapsed && (
            <button 
              className="sidebar-toggle-trigger btn btn-primary"
              onClick={() => setSidebarCollapsed(false)}
              title="Expand Sidebar"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
              </svg>
            </button>
          )}
          
          <div className="reader-container">
            {activeSection ? (
              <div className="reader-content-width">
                
                {/* Header Section */}
                <div className="reader-header">
                  <div>
                    <div className="reader-subject-tag">{activeSubject.title}</div>
                    <h2 className="reader-title">{activeSection.title}</h2>
                  </div>
                  <button 
                    className={`bookmark-toggle-btn ${isBookmarked ? 'bookmarked' : ''}`}
                    onClick={handleToggleBookmark}
                  >
                    {isBookmarked ? '★ Bookmarked' : '☆ Bookmark Topic'}
                  </button>
                </div>

                {/* Content Body */}
                <div className="reader-body" dangerouslySetInnerHTML={{ __html: activeSection.content }} />

                {/* Optional Code Snippet Block */}
                {activeSection.code && (
                  <div className="code-block-wrapper">
                    <div className="code-block-header">
                      <span>Interactive Code Sample</span>
                    </div>
                    <pre className="code-block-content">{activeSection.code}</pre>
                  </div>
                )}

                {/* Optional Interactive Simulator Component */}
                {activeSection.simulator && (
                  <div style={{ marginTop: '32px' }}>
                    <span className="simulator-label" style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Interactive Laboratory Sim
                    </span>
                    {renderSimulator(activeSection.simulator)}
                  </div>
                )}

                {/* Section Footer: Mark Completion & Next Button */}
                <div style={{ 
                  display: 'flex', 
                  flexWrap: 'wrap', 
                  gap: '16px', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  marginTop: '48px', 
                  paddingTop: '24px', 
                  borderTop: '1px solid var(--border-glass)' 
                }}>
                  <button 
                    onClick={handleToggleCompleted} 
                    className={`btn ${progress[activeSectionId] ? 'btn-secondary' : 'btn-primary'}`}
                    style={{ height: '42px', minWidth: '160px' }}
                  >
                    {progress[activeSectionId] ? 'Completed ✓' : '✓ Mark as Completed'}
                  </button>
                  
                  {nextSection && (
                    <button 
                      onClick={() => handleNavigateToSection(activeSubjectId, nextSection.chapterId, nextSection.sectionId)} 
                      className="btn btn-secondary"
                      style={{ height: '42px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                    >
                      Next Topic: {nextSection.title}
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                        <polyline points="12 5 19 12 12 19"></polyline>
                      </svg>
                    </button>
                  )}
                </div>

                {/* Practice Quiz section at the very bottom of pages */}
                <QuizWidget topicId={activeSectionId} />

              </div>
            ) : (
              <div className="reader-content-width" style={{ padding: '40px 0', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '16px' }}>
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
                <h3 style={{ marginTop: '0px' }}>Topic not found</h3>
                <p style={{ color: 'var(--text-secondary)' }}>Choose a valid chapter from the left sidebar navigation.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
