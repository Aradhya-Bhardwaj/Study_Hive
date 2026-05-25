import React, { useState, useEffect } from 'react';
import { quizzesData } from '../data/quizzes';

export default function QuizWidget({ topicId, onQuizComplete }) {
  const [questions, setQuestions] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedOpt, setSelectedOpt] = useState(null);
  const [score, setScore] = useState(0);
  const [showFeedback, setShowFeedback] = useState(false);
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    const topicQuestions = quizzesData[topicId] || [];
    setQuestions(topicQuestions);
    setCurrentIdx(0);
    setSelectedOpt(null);
    setScore(0);
    setShowFeedback(false);
    setFinished(false);
  }, [topicId]);

  // ── Empty State ──
  if (questions.length === 0) {
    return (
      <div className="quiz-widget">
        <div className="quiz-card">
          <div className="quiz-empty">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <p className="quiz-empty-title">No questions available</p>
            <p className="quiz-empty-sub">Practice questions for this section are coming soon.</p>
          </div>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentIdx];
  const progressPct = Math.round((currentIdx / questions.length) * 100);

  const handleOptionClick = (optIdx) => {
    if (selectedOpt !== null) return;
    setSelectedOpt(optIdx);
    setShowFeedback(true);
    if (optIdx === currentQuestion.answer) {
      setScore(s => s + 1);
    }
  };

  const handleNext = () => {
    setSelectedOpt(null);
    setShowFeedback(false);
    if (currentIdx + 1 < questions.length) {
      setCurrentIdx(i => i + 1);
    } else {
      setFinished(true);
      if (onQuizComplete) {
        const finalScore = score + (selectedOpt === currentQuestion.answer ? 1 : 0);
        onQuizComplete(finalScore, questions.length);
      }
    }
  };

  const restartQuiz = () => {
    setCurrentIdx(0);
    setSelectedOpt(null);
    setScore(0);
    setShowFeedback(false);
    setFinished(false);
  };

  // ── Finished Screen ──
  if (finished) {
    const percentage = Math.round((score / questions.length) * 100);
    const tier = percentage >= 80 ? 'gold' : percentage >= 50 ? 'silver' : 'study';

    const tierIcon = {
      gold: (
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/>
          <path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/>
          <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/>
          <path d="M18 2H6v7a6 6 0 0 0 12 0V2z"/>
        </svg>
      ),
      silver: (
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/>
        </svg>
      ),
      study: (
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--accent-primary-light)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
        </svg>
      ),
    }[tier];

    return (
      <div className="quiz-widget">
        <div className="quiz-card">
          <div className="quiz-completed-screen">
            <div className="quiz-completed-icon">{tierIcon}</div>
            <div className="quiz-score-ring" style={{
              borderColor: tier === 'gold' ? '#fbbf24' : tier === 'silver' ? '#94a3b8' : 'var(--accent-primary)',
              boxShadow: `0 0 32px ${tier === 'gold' ? 'rgba(251,191,36,0.25)' : tier === 'silver' ? 'rgba(148,163,184,0.2)' : 'var(--accent-primary-glow-strong)'}`
            }}>
              <span className="quiz-score-pct" style={{
                color: tier === 'gold' ? '#fbbf24' : tier === 'silver' ? '#94a3b8' : 'var(--accent-primary-light)'
              }}>{percentage}%</span>
              <span className="quiz-score-lbl">Score</span>
            </div>
            <h3 className="quiz-completed-title">Quiz Complete!</h3>
            <p className="quiz-completed-score">
              You answered <span>{score}</span> of <span>{questions.length}</span> correctly
            </p>
            <button onClick={restartQuiz} className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M23 4v6h-6"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
              </svg>
              Retake Quiz
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Active Quiz ──
  return (
    <div className="quiz-widget">
      <div className="quiz-widget-label">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/>
        </svg>
        Practice Quiz
      </div>

      <div className="quiz-card">
        {/* Progress Bar */}
        <div className="quiz-progress-bar-track">
          <div className="quiz-progress-bar-fill" style={{ width: `${progressPct}%` }} />
        </div>

        {/* Top Bar */}
        <div className="quiz-card-top">
          <span className="quiz-tag">Practice Quiz</span>
          <span className="quiz-progress">
            {currentIdx + 1} / {questions.length}
          </span>
        </div>

        {/* Body */}
        <div className="quiz-card-body">
          <p className="quiz-question">{currentQuestion.question}</p>

          <div className="quiz-options">
            {currentQuestion.options.map((opt, oIdx) => {
              let cls = '';
              if (selectedOpt !== null) {
                cls = 'disabled';
                if (oIdx === currentQuestion.answer) cls += ' correct';
                else if (oIdx === selectedOpt) cls += ' incorrect';
              }
              return (
                <div
                  key={oIdx}
                  className={`quiz-option ${cls}`}
                  onClick={() => handleOptionClick(oIdx)}
                >
                  <span className="quiz-option-letter">
                    {String.fromCharCode(65 + oIdx)}
                  </span>
                  {opt}
                </div>
              );
            })}
          </div>
        </div>

        {/* Feedback */}
        {showFeedback && (
          <div className={`quiz-feedback ${selectedOpt === currentQuestion.answer ? 'correct' : 'incorrect'}`}>
            <span className={`quiz-verdict ${selectedOpt === currentQuestion.answer ? 'correct' : 'incorrect'}`}>
              {selectedOpt === currentQuestion.answer ? '✓ Correct!' : '✗ Incorrect'}
            </span>
            <p className="quiz-explanation">{currentQuestion.explanation}</p>
          </div>
        )}

        {/* Footer Action */}
        {selectedOpt !== null && (
          <div className="quiz-card-footer">
            <button onClick={handleNext} className="btn btn-primary">
              {currentIdx + 1 === questions.length ? 'Finish Quiz' : 'Next Question'}
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
