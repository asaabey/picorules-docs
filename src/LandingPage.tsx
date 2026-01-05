import './LandingPage.css';

interface LandingPageProps {
  onEnterDocs: () => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

export function LandingPage({ onEnterDocs, theme, onToggleTheme }: LandingPageProps) {
  return (
    <div className="landing">
      {/* Navigation */}
      <nav className="landing-nav">
        <div className="landing-nav__logo">
          <img src="/favicon-32x32.png" alt="Picorules" className="landing-nav__icon" />
          <span className="landing-nav__brand">Picorules</span>
        </div>
        <div className="landing-nav__actions">
          <button
            className="landing-nav__theme-btn"
            onClick={onToggleTheme}
            aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          >
            {theme === 'light' ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="5" />
                <line x1="12" y1="1" x2="12" y2="3" />
                <line x1="12" y1="21" x2="12" y2="23" />
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                <line x1="1" y1="12" x2="3" y2="12" />
                <line x1="21" y1="12" x2="23" y2="12" />
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
              </svg>
            )}
          </button>
          <a
            href="https://github.com/asaabey/picorules-docs"
            target="_blank"
            rel="noopener noreferrer"
            className="landing-nav__github"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
            </svg>
          </a>
          <button className="landing-nav__cta" onClick={onEnterDocs}>
            Read the Docs
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero">
        <div className="hero__badges">
          <div className="hero__badge">Clinical Decision Support</div>
          <a
            href="https://github.com/asaabey/picorules-docs"
            target="_blank"
            rel="noopener noreferrer"
            className="hero__badge hero__badge--opensource"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
            </svg>
            Open Source
          </a>
        </div>
        <h1 className="hero__title">
          Write clinical logic,<br />
          <span className="hero__gradient">not SQL queries.</span>
        </h1>
        <p className="hero__subtitle">
          Picorules is a domain-specific language that transforms clinical decision
          support authoring from complex SQL into clear, readable logic that clinicians
          and developers can understand together.
        </p>
        <div className="hero__actions">
          <button className="hero__btn hero__btn--primary" onClick={onEnterDocs}>
            Get Started
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </button>
          <a
            href="https://github.com/asaabey/picorules-docs"
            target="_blank"
            rel="noopener noreferrer"
            className="hero__btn hero__btn--secondary"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
            </svg>
            View on GitHub
          </a>
        </div>

        {/* Code Preview */}
        <div className="hero__code">
          <div className="code-window">
            <div className="code-window__header">
              <div className="code-window__dots">
                <span></span><span></span><span></span>
              </div>
              <span className="code-window__title">anaemia_screening.prb</span>
            </div>
            <pre className="code-window__content">
              <code>{`#define_ruleblock(anaemia_screening, {
    description: "Anaemia screening for CKD patients",
    is_active: 2
});

// Get latest haemoglobin result
hb_last => eadv.lab_bld_haemoglobin.val.last();

// Define anaemia thresholds
is_anaemic : { hb_last < 120 => 1 }, { => 0 };

// Generate alert if anaemic and no recent iron studies
needs_workup : {
    is_anaemic = 1 and iron_ld < sysdate - 90 => 1
}, { => 0 };`}</code>
            </pre>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features">
        <div className="features__header">
          <h2 className="features__title">Why Picorules?</h2>
          <p className="features__subtitle">
            Built for healthcare teams who need powerful clinical logic without the complexity of raw SQL.
          </p>
        </div>

        <div className="features__grid">
          <div className="feature-card">
            <div className="feature-card__icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
              </svg>
            </div>
            <h3 className="feature-card__title">Developer Friendly</h3>
            <p className="feature-card__text">
              Clean syntax inspired by modern programming languages. Write logic that reads like natural language.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-card__icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
              </svg>
            </div>
            <h3 className="feature-card__title">Clinical First</h3>
            <p className="feature-card__text">
              Purpose-built for EADV clinical data models. Aggregate, window, and transform patient data effortlessly.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-card__icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="16 18 22 12 16 6" />
                <polyline points="8 6 2 12 8 18" />
              </svg>
            </div>
            <h3 className="feature-card__title">Compiles to SQL</h3>
            <p className="feature-card__text">
              Generates optimized SQL with CTEs, window functions, and proper joins. No runtime overhead.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-card__icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <line x1="3" y1="9" x2="21" y2="9" />
                <line x1="9" y1="21" x2="9" y2="9" />
              </svg>
            </div>
            <h3 className="feature-card__title">Modular Design</h3>
            <p className="feature-card__text">
              Chain ruleblocks together. Reference outputs from other rules to build complex clinical workflows.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-card__icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 20h9" />
                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
              </svg>
            </div>
            <h3 className="feature-card__title">Self-Documenting</h3>
            <p className="feature-card__text">
              Built-in directives for descriptions, citations, and attribute metadata. Your logic documents itself.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-card__icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
              </svg>
            </div>
            <h3 className="feature-card__title">Open Source</h3>
            <p className="feature-card__text">
              Free to use, modify, and contribute. Built in the open by Territory Kidney Care for the healthcare community.
            </p>
          </div>
        </div>
      </section>

      {/* IDE Section */}
      <section className="ide-section">
        <div className="ide-section__content">
          <div className="ide-section__text">
            <div className="ide-section__badge">Picorules Studio</div>
            <h2 className="ide-section__title">
              A complete IDE for<br />clinical rule development
            </h2>
            <p className="ide-section__description">
              Write, compile, and test your Picorules in real-time. Picorules Studio
              provides a professional development environment with syntax highlighting,
              live SQL compilation, mock data generation, and instant execution against
              PostgreSQL.
            </p>
            <ul className="ide-section__features">
              <li>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Monaco-powered editor with Picorules syntax highlighting
              </li>
              <li>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Real-time SQL compilation as you type
              </li>
              <li>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Generate synthetic EADV test data instantly
              </li>
              <li>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Execute rules and view results in real-time
              </li>
            </ul>
            <div className="ide-section__actions">
              <a
                href="https://studio.picorules.com"
                target="_blank"
                rel="noopener noreferrer"
                className="ide-section__btn ide-section__btn--primary"
              >
                Try Picorules Studio
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                  <polyline points="15 3 21 3 21 9" />
                  <line x1="10" y1="14" x2="21" y2="3" />
                </svg>
              </a>
              <a
                href="https://github.com/asaabey/picorules-compiler-js-webapp"
                target="_blank"
                rel="noopener noreferrer"
                className="ide-section__btn ide-section__btn--secondary"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                </svg>
                View Source
              </a>
            </div>
          </div>
          <div className="ide-section__preview">
            <div className="ide-preview">
              <div className="ide-preview__header">
                <div className="ide-preview__dots">
                  <span></span><span></span><span></span>
                </div>
                <span className="ide-preview__title">Picorules Studio</span>
              </div>
              <div className="ide-preview__content">
                <div className="ide-preview__sidebar">
                  <div className="ide-preview__sidebar-item ide-preview__sidebar-item--active">anaemia_screening</div>
                  <div className="ide-preview__sidebar-item">ckd_staging</div>
                  <div className="ide-preview__sidebar-item">diabetes_check</div>
                </div>
                <div className="ide-preview__editor">
                  <div className="ide-preview__line"><span className="ide-preview__directive">#define_ruleblock</span>(anaemia, {'{'}</div>
                  <div className="ide-preview__line ide-preview__line--indent"><span className="ide-preview__key">description</span>: <span className="ide-preview__string">"Anaemia screening"</span></div>
                  <div className="ide-preview__line">{'}'});</div>
                  <div className="ide-preview__line"></div>
                  <div className="ide-preview__line"><span className="ide-preview__var">hb_last</span> <span className="ide-preview__op">=&gt;</span> eadv.lab_bld_hb.<span className="ide-preview__func">last</span>();</div>
                  <div className="ide-preview__line"><span className="ide-preview__var">is_anaemic</span> <span className="ide-preview__op">:</span> {'{'} hb_last &lt; 120 <span className="ide-preview__op">=&gt;</span> 1 {'}'}, {'{'} <span className="ide-preview__op">=&gt;</span> 0 {'}'});</div>
                </div>
                <div className="ide-preview__results">
                  <div className="ide-preview__results-header">Results</div>
                  <div className="ide-preview__results-row ide-preview__results-row--header">
                    <span>eid</span><span>hb_last</span><span>is_anaemic</span>
                  </div>
                  <div className="ide-preview__results-row">
                    <span>P001</span><span>145</span><span>0</span>
                  </div>
                  <div className="ide-preview__results-row">
                    <span>P002</span><span>98</span><span>1</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SDK Section */}
      <section className="sdk-section">
        <div className="sdk-section__header">
          <div className="sdk-section__badge">Picorules SDK</div>
          <h2 className="sdk-section__title">Build with npm packages</h2>
          <p className="sdk-section__subtitle">
            Integrate Picorules into your own applications with our JavaScript/TypeScript SDK.
            Available on npm with full TypeScript support.
          </p>
        </div>

        <div className="sdk-section__grid">
          <a
            href="https://www.npmjs.com/package/picorules-compiler-js-core"
            target="_blank"
            rel="noopener noreferrer"
            className="sdk-card"
          >
            <div className="sdk-card__header">
              <div className="sdk-card__icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="16 18 22 12 16 6" />
                  <polyline points="8 6 2 12 8 18" />
                </svg>
              </div>
              <span className="sdk-card__npm">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M0 0v24h24V0H0zm19.2 19.2H12v-9.6H7.2v9.6H4.8V4.8h14.4v14.4z"/>
                </svg>
                npm
              </span>
            </div>
            <h3 className="sdk-card__title">picorules-compiler-js-core</h3>
            <p className="sdk-card__description">
              Core compiler that parses Picorules and generates optimized SQL for Oracle, PostgreSQL, and SQL Server.
            </p>
            <div className="sdk-card__features">
              <span>Multi-dialect SQL</span>
              <span>24 built-in functions</span>
              <span>TypeScript</span>
            </div>
          </a>

          <a
            href="https://www.npmjs.com/package/picorules-compiler-js-eadv-mocker"
            target="_blank"
            rel="noopener noreferrer"
            className="sdk-card"
          >
            <div className="sdk-card__header">
              <div className="sdk-card__icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                  <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                  <line x1="12" y1="22.08" x2="12" y2="12" />
                </svg>
              </div>
              <span className="sdk-card__npm">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M0 0v24h24V0H0zm19.2 19.2H12v-9.6H7.2v9.6H4.8V4.8h14.4v14.4z"/>
                </svg>
                npm
              </span>
            </div>
            <h3 className="sdk-card__title">picorules-compiler-js-eadv-mocker</h3>
            <p className="sdk-card__description">
              Generate synthetic EADV clinical data for testing. Auto-extracts attributes from ruleblocks.
            </p>
            <div className="sdk-card__features">
              <span>Mock data generation</span>
              <span>Seeded random</span>
              <span>Clinical values</span>
            </div>
          </a>

          <a
            href="https://www.npmjs.com/package/picorules-compiler-js-db-manager"
            target="_blank"
            rel="noopener noreferrer"
            className="sdk-card"
          >
            <div className="sdk-card__header">
              <div className="sdk-card__icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <ellipse cx="12" cy="5" rx="9" ry="3" />
                  <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
                  <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
                </svg>
              </div>
              <span className="sdk-card__npm">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M0 0v24h24V0H0zm19.2 19.2H12v-9.6H7.2v9.6H4.8V4.8h14.4v14.4z"/>
                </svg>
                npm
              </span>
            </div>
            <h3 className="sdk-card__title">picorules-compiler-js-db-manager</h3>
            <p className="sdk-card__description">
              Execute compiled Picorules SQL against Oracle, PostgreSQL, or SQL Server databases.
            </p>
            <div className="sdk-card__features">
              <span>Multi-database</span>
              <span>Batch testing</span>
              <span>Validation</span>
            </div>
          </a>
        </div>

        <div className="sdk-section__code">
          <div className="sdk-code-window">
            <div className="sdk-code-window__header">
              <span className="sdk-code-window__title">Quick Start</span>
            </div>
            <pre className="sdk-code-window__content">
              <code>{`npm install picorules-compiler-js-core

import { compile, Dialect } from 'picorules-compiler-js-core';

const result = compile([{
  name: 'ckd_screening',
  text: \`
    egfr_last => eadv.lab_bld_egfr.val.last();
    has_ckd : { egfr_last < 60 => 1 }, { => 0 };
  \`,
  isActive: true
}], { dialect: Dialect.POSTGRESQL });

console.log(result.sql[0]); // Compiled SQL`}</code>
            </pre>
          </div>
        </div>

        <div className="sdk-section__footer">
          <a
            href="https://github.com/asaabey/picorules-compiler-js-core"
            target="_blank"
            rel="noopener noreferrer"
            className="sdk-section__link"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
            </svg>
            View all packages on GitHub
          </a>
        </div>
      </section>

      {/* Comparison Section */}
      <section className="comparison">
        <h2 className="comparison__title">Before & After</h2>
        <p className="comparison__subtitle">See the difference Picorules makes</p>

        <div className="comparison__grid">
          <div className="comparison__panel comparison__panel--before">
            <div className="comparison__label">Without Picorules</div>
            <pre className="comparison__code">
              <code>{`WITH latest_hb AS (
  SELECT eid, val, dt,
    ROW_NUMBER() OVER (
      PARTITION BY eid
      ORDER BY dt DESC
    ) as rn
  FROM eadv_data
  WHERE att = 'lab_bld_haemoglobin'
),
latest_iron AS (
  SELECT eid, dt,
    ROW_NUMBER() OVER (
      PARTITION BY eid
      ORDER BY dt DESC
    ) as rn
  FROM eadv_data
  WHERE att = 'lab_bld_iron'
)
SELECT
  h.eid,
  h.val as hb_last,
  CASE WHEN h.val < 120
       THEN 1 ELSE 0 END as is_anaemic,
  CASE WHEN h.val < 120
       AND i.dt < SYSDATE - 90
       THEN 1 ELSE 0 END as needs_workup
FROM latest_hb h
LEFT JOIN latest_iron i
  ON h.eid = i.eid AND i.rn = 1
WHERE h.rn = 1;`}</code>
            </pre>
          </div>

          <div className="comparison__panel comparison__panel--after">
            <div className="comparison__label">With Picorules</div>
            <pre className="comparison__code">
              <code>{`hb_last => eadv.lab_bld_haemoglobin.val.last();

iron_ld => eadv.lab_bld_iron.dt.max();

is_anaemic : { hb_last < 120 => 1 }, { => 0 };

needs_workup : {
    is_anaemic = 1 and iron_ld < sysdate - 90 => 1
}, { => 0 };`}</code>
            </pre>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta">
        <h2 className="cta__title">Ready to simplify your clinical logic?</h2>
        <p className="cta__subtitle">
          Dive into the comprehensive documentation and start building better decision support today.
        </p>
        <button className="cta__btn" onClick={onEnterDocs}>
          Explore the Documentation
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="5" y1="12" x2="19" y2="12" />
            <polyline points="12 5 19 12 12 19" />
          </svg>
        </button>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="landing-footer__content">
          <div className="landing-footer__brand">
            <img src="/favicon-32x32.png" alt="Picorules" />
            <span>Picorules</span>
          </div>

          <div className="landing-footer__links">
            <a href="https://github.com/asaabey/picorules-docs" target="_blank" rel="noopener noreferrer">
              GitHub
            </a>
            <button onClick={onEnterDocs} className="landing-footer__link-btn">
              Documentation
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
