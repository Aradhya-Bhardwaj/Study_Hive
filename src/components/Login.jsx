import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import loginDark  from '../assets/login_dark.png';
import loginLight from '../assets/login_light.png';
import loginSepia from '../assets/login_sepia.png';

/* ── OAuth Provider Config ── */
const PROVIDERS = {
  google: {
    name: 'Google',
    color: '#4285F4',
    bgColor: 'linear-gradient(135deg, #4285F4 0%, #34A853 100%)',
    textColor: '#fff',
    headerBg: '#4285F4',
    steps: ['Connecting to Google…', 'Verifying your identity…', 'Signing you in…'],
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.2-5.142 4.2-3.483 0-6.306-2.822-6.306-6.305 0-3.484 2.823-6.306 6.306-6.306 1.606 0 3.057.6 4.19 1.582l3.052-3.052C19.23 2.685 15.936 1.5 12.24 1.5 6.474 1.5 1.8 6.174 1.8 11.94s4.674 10.44 10.44 10.44c5.966 0 10.44-4.178 10.44-10.44 0-.66-.06-1.285-.18-1.855H12.24Z"/>
      </svg>
    ),
    bigIcon: (
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
      </svg>
    ),
  },
  microsoft: {
    name: 'Microsoft',
    color: '#0078D4',
    bgColor: 'linear-gradient(135deg, #0078D4 0%, #005A9E 100%)',
    textColor: '#fff',
    headerBg: '#0078D4',
    steps: ['Connecting to Microsoft…', 'Verifying your account…', 'Completing sign-in…'],
    icon: (
      <svg width="20" height="20" viewBox="0 0 23 23" fill="currentColor">
        <path fill="#f35325" d="M0 0h11v11H0z"/>
        <path fill="#81bc06" d="M12 0h11v11H12z"/>
        <path fill="#05a6f0" d="M0 12h11v11H0z"/>
        <path fill="#ffba08" d="M12 12h11v11H12z"/>
      </svg>
    ),
    bigIcon: (
      <svg width="48" height="48" viewBox="0 0 23 23">
        <path fill="#f35325" d="M0 0h11v11H0z"/>
        <path fill="#81bc06" d="M12 0h11v11H12z"/>
        <path fill="#05a6f0" d="M0 12h11v11H0z"/>
        <path fill="#ffba08" d="M12 12h11v11H12z"/>
      </svg>
    ),
  },
  github: {
    name: 'GitHub',
    color: '#24292e',
    bgColor: 'linear-gradient(135deg, #24292e 0%, #444d56 100%)',
    textColor: '#fff',
    headerBg: '#24292e',
    steps: ['Connecting to GitHub…', 'Authorizing application…', 'Setting up your profile…'],
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
      </svg>
    ),
    bigIcon: (
      <svg width="48" height="48" viewBox="0 0 24 24" fill="#fff">
        <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
      </svg>
    ),
  },
};

/* ── OAuth Simulation Modal ── */
function OAuthModal({ provider, onClose, onSuccess }) {
  const [step, setStep] = useState(0); // 0=prompt, 1=loading, 2=success, 3=error
  const [progress, setProgress] = useState(0);
  const [currentMsg, setCurrentMsg] = useState(0);
  const cfg = PROVIDERS[provider];
  const timerRef = useRef(null);

  const handleContinue = () => {
    setStep(1);
    // Animate through the loading steps
    const msgs = cfg.steps;
    let msgIdx = 0;
    let prog = 0;
    const tick = setInterval(() => {
      prog += Math.random() * 18 + 8;
      if (prog >= 100) prog = 100;
      setProgress(Math.min(prog, 100));

      if (prog > 33 && msgIdx < 1) { msgIdx = 1; setCurrentMsg(1); }
      if (prog > 66 && msgIdx < 2) { msgIdx = 2; setCurrentMsg(2); }

      if (prog >= 100) {
        clearInterval(tick);
        setStep(2);
        timerRef.current = setTimeout(() => onSuccess(), 1000);
      }
    }, 180);
    timerRef.current = tick;
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  return (
    <div className="oauth-modal-backdrop" onClick={step < 1 ? onClose : undefined}>
      <div
        className={`oauth-modal-window ${step === 2 ? 'success' : ''}`}
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header bar */}
        <div className="oauth-modal-titlebar">
          <div className="oauth-titlebar-dots">
            <span className="dot red" onClick={onClose}></span>
            <span className="dot yellow"></span>
            <span className="dot green"></span>
          </div>
          <span className="oauth-titlebar-url">
            accounts.{provider}.com
          </span>
          <div style={{ width: 52 }}></div>
        </div>

        {/* Content */}
        <div className="oauth-modal-body">
          {step === 0 && (
            <div className="oauth-prompt-screen">
              <div className="oauth-provider-logo" style={{ background: cfg.bgColor }}>
                {cfg.bigIcon}
              </div>
              <h2 className="oauth-prompt-title">Sign in with {cfg.name}</h2>
              <p className="oauth-prompt-sub">
                You'll be signed in to <strong>StudyHive</strong> using your {cfg.name} account. 
                Your credentials are handled securely.
              </p>
              <div className="oauth-account-row">
                <div className="oauth-account-avatar" style={{ background: cfg.bgColor }}>
                  {cfg.icon}
                </div>
                <div>
                  <div className="oauth-account-name">Continue with {cfg.name}</div>
                  <div className="oauth-account-email">your {provider} account</div>
                </div>
              </div>
              <button
                className="oauth-continue-btn"
                style={{ background: cfg.bgColor }}
                onClick={handleContinue}
              >
                Continue as {cfg.name} user
              </button>
              <button className="oauth-cancel-btn" onClick={onClose}>
                Cancel
              </button>
              <p className="oauth-terms">
                By continuing, you agree to StudyHive's Terms of Service and Privacy Policy.
              </p>
            </div>
          )}

          {step === 1 && (
            <div className="oauth-loading-screen">
              <div className="oauth-loading-logo" style={{ background: cfg.bgColor }}>
                {cfg.bigIcon}
              </div>
              <h3 className="oauth-loading-title">Signing in with {cfg.name}</h3>
              <div className="oauth-progress-track">
                <div
                  className="oauth-progress-fill"
                  style={{
                    width: `${progress}%`,
                    background: cfg.bgColor,
                    transition: 'width 0.2s ease'
                  }}
                ></div>
              </div>
              <p className="oauth-loading-msg">{cfg.steps[currentMsg]}</p>
              <div className="oauth-loading-dots">
                <span></span><span></span><span></span>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="oauth-success-screen">
              <div className="oauth-success-check">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </div>
              <h3 className="oauth-success-title">Signed in!</h3>
              <p className="oauth-success-sub">Redirecting to StudyHive…</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Login() {
  const { login, register, socialLogin } = useAuth();
  const [isLoginTab,       setIsLoginTab]       = useState(true);
  const [username,         setUsername]          = useState('');
  const [email,            setEmail]             = useState('');
  const [password,         setPassword]          = useState('');
  const [confirmPassword,  setConfirmPassword]   = useState('');
  const [showPassword,     setShowPassword]      = useState(false);
  const [errorMsg,         setErrorMsg]          = useState('');
  const [successMsg,       setSuccessMsg]        = useState('');
  const [theme,            setTheme]             = useState('dark');
  const [oauthProvider,    setOauthProvider]     = useState(null); // null | 'google' | 'microsoft' | 'github'

  /* ── Restore theme on mount ── */
  useEffect(() => {
    const saved = localStorage.getItem('studyhive_theme') || 'dark';
    applyTheme(saved);
  }, []);

  const applyTheme = (t) => {
    setTheme(t);
    localStorage.setItem('studyhive_theme', t);
    if (t === 'dark') {
      document.documentElement.removeAttribute('data-theme');
    } else {
      document.documentElement.setAttribute('data-theme', t);
    }
  };

  /* ── Form submit ── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (isLoginTab) {
      if (!username.trim() || !password) {
        setErrorMsg('All fields are required');
        return;
      }
      const res = await login(username.trim(), password);
      if (!res.success) setErrorMsg(res.message);
    } else {
      if (!username.trim() || !email.trim() || !password) {
        setErrorMsg('All fields are required');
        return;
      }
      if (password !== confirmPassword) { setErrorMsg('Passwords do not match'); return; }
      const res = await register(username.trim(), email.trim(), password);
      if (res.success) setSuccessMsg('Account created! Signing you in…');
      else setErrorMsg(res.message);
    }
  };

  const toggleTab = (toLogin) => {
    setIsLoginTab(toLogin);
    setUsername(''); setEmail(''); setPassword(''); setConfirmPassword('');
    setShowPassword(false); setErrorMsg(''); setSuccessMsg('');
  };

  /* Pick the correct illustration */
  const heroImg = theme === 'light' ? loginLight : theme === 'sepia' ? loginSepia : loginDark;

  /* Tagline per theme */
  const tagline = theme === 'light'
    ? 'Your bright study companion'
    : theme === 'sepia'
    ? 'Knowledge, the timeless way'
    : 'Master CS, one topic at a time';

  return (
    <div className="auth-page-wrapper">

      {/* ── Theme Switcher ── */}
      <div className="auth-theme-switcher">
        <button onClick={() => applyTheme('dark')}  className={`auth-theme-btn ${theme === 'dark'  ? 'active' : ''}`} title="Dark Mode">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
          </svg>
        </button>
        <button onClick={() => applyTheme('light')} className={`auth-theme-btn ${theme === 'light' ? 'active' : ''}`} title="Light Mode">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="5"/>
            <line x1="12" y1="1"  x2="12" y2="3"/>  <line x1="12" y1="21" x2="12" y2="23"/>
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/> <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
            <line x1="1" y1="12"  x2="3" y2="12"/>  <line x1="21" y1="12" x2="23" y2="12"/>
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/> <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
          </svg>
        </button>
        <button onClick={() => applyTheme('sepia')} className={`auth-theme-btn ${theme === 'sepia' ? 'active' : ''}`} title="Sepia Mode">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
          </svg>
        </button>
      </div>

      {/* ── Browser/Device Mockup Frame ── */}
      <div className="auth-mockup-frame">

        {/* LEFT: full-bleed illustration */}
        <div className="auth-panel-left">
          {/* The scene image fills this panel completely */}
          <img
            src={heroImg}
            alt="Study scene illustration"
            className="auth-illustration-img"
          />
          {/* Gradient overlay rendered as a child div */}
          <div className="auth-illustration-wrapper" aria-hidden="true" />

          {/* Badge top-left */}
          <div className="auth-brand-badge">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5z"/>
              <path d="M2 17l10 5 10-5"/>
              <path d="M2 12l10 5 10-5"/>
            </svg>
            <span>STUDYHIVE ACADEMIC</span>
          </div>

          {/* Tagline bottom-left */}
          <p className="auth-panel-tagline">{tagline}</p>
        </div>

        {/* RIGHT: form card */}
        <div className="auth-panel-right">
          <div className="auth-form-card">

            {/* Logo + Title */}
            <div className="auth-card-header">
              <div className="auth-logo-row">
                <svg className="auth-logo-svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                  <path d="M2 17l10 5 10-5"/>
                  <path d="M2 12l10 5 10-5"/>
                </svg>
                <span className="auth-brand-name">studyhive</span>
              </div>
              <h2 className="auth-card-title">
                {isLoginTab ? 'Sign in' : 'Create account'}
              </h2>
            </div>

            {/* Alerts */}
            {errorMsg && (
              <div className="auth-notification error">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                <span>{errorMsg}</span>
              </div>
            )}
            {successMsg && (
              <div className="auth-notification success">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                <span>{successMsg}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="auth-form">
              <div className="auth-field">
                <input
                  type="text"
                  className="auth-input-field"
                  placeholder={isLoginTab ? "Username or Email" : "Username"}
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  required
                  autoComplete="username"
                />
              </div>

              {!isLoginTab && (
                <div className="auth-field">
                  <input
                    type="email"
                    className="auth-input-field"
                    placeholder="Email Address"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                  />
                </div>
              )}

              <div className="auth-field password-field">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="auth-input-field"
                  placeholder="Password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  autoComplete={isLoginTab ? 'current-password' : 'new-password'}
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowPassword(p => !p)}
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                      <line x1="1" y1="1" x2="23" y2="23"/>
                    </svg>
                  ) : (
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  )}
                </button>
              </div>

              {!isLoginTab && (
                <div className="auth-field">
                  <input
                    type="password"
                    className="auth-input-field"
                    placeholder="Confirm Password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                  />
                </div>
              )}

              <button type="submit" className="auth-action-btn">
                {isLoginTab ? 'Sign in' : 'Create account'}
              </button>
            </form>



            {/* Terms */}
            <p className="auth-terms-text">
              By creating an account you agree to StudyHive's{' '}
              <a href="#terms">Terms of Services</a> and{' '}
              <a href="#privacy">Privacy Policy</a>.
            </p>

            {/* Footer toggle */}
            <div className="auth-card-footer">
              {isLoginTab ? (
                <p>Don't have an account? <span className="auth-link-text" onClick={() => toggleTab(false)}>Register</span></p>
              ) : (
                <p>Have an account? <span className="auth-link-text" onClick={() => toggleTab(true)}>Log in</span></p>
              )}
            </div>

          </div>
        </div>

      </div>

      {/* ── OAuth Modal Overlay ── */}
      {oauthProvider && (
        <OAuthModal
          provider={oauthProvider}
          onClose={() => setOauthProvider(null)}
          onSuccess={async () => {
            await socialLogin(oauthProvider);
            setOauthProvider(null);
          }}
        />
      )}

    </div>
  );
}
