import { useEffect, useMemo, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { docs } from './docs';
import { getBuildNumber } from './buildInfo';
import './App.css';

function App() {
  const [selectedDocId, setSelectedDocId] = useState(docs[0].id);
  const [query, setQuery] = useState('');
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    // Initialize theme from localStorage or system preference
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    if (savedTheme) return savedTheme;

    // Check system preference
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  });

  const filteredDocs = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return docs;
    return docs.filter(
      (doc) =>
        doc.title.toLowerCase().includes(q) ||
        doc.description.toLowerCase().includes(q),
    );
  }, [query]);

  useEffect(() => {
    if (filteredDocs.length === 0) {
      return;
    }
    const stillVisible = filteredDocs.some((doc) => doc.id === selectedDocId);
    if (!stillVisible) {
      setSelectedDocId(filteredDocs[0].id);
    }
  }, [filteredDocs, selectedDocId]);

  // Apply theme to document and save to localStorage
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  const activeDoc =
    docs.find((doc) => doc.id === selectedDocId) ?? docs[0];

  return (
    <div className="docs-app">
      <aside className="sidebar">
        <header className="sidebar__header">
          <div className="logo-section">
            <img
              src="/favicon-32x32.png"
              alt="Picorules Logo"
              className="logo-icon"
            />
            <div className="logo-text">
              <p className="eyebrow">Picorules Language</p>
              <h1>The Picorules Book</h1>
            </div>
          </div>
          <p className="subtitle">
            A comprehensive guide to clinical decision support
          </p>
          <input
            className="search"
            placeholder="Search topics..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </header>
        <nav className="nav">
          {filteredDocs.length === 0 && (
            <p className="empty-state">No matches found.</p>
          )}
          {filteredDocs.map((doc) => (
            <button
              key={doc.id}
              className={`nav__item ${
                doc.id === activeDoc.id ? 'nav__item--active' : ''
              }`}
              onClick={() => setSelectedDocId(doc.id)}
            >
              <span className="nav__title">{doc.title}</span>
              <span className="nav__description">{doc.description}</span>
            </button>
          ))}
        </nav>
        <div className="build-info">{getBuildNumber()}</div>
      </aside>
      <main className="content">
        <div className="header-actions">
          <button
            className="icon-button"
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          >
            {theme === 'light' ? (
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            ) : (
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
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
            href="https://github.com/asaabey/tkc-picorules-rules"
            target="_blank"
            rel="noopener noreferrer"
            className="github-link"
            aria-label="View source on GitHub"
          >
            <button className="icon-button" title="View on GitHub">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
            </button>
          </a>
        </div>
        <article>
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {activeDoc.content}
          </ReactMarkdown>
        </article>
        <footer className="footer">
          The Picorules Book — A complete reference for clinical decision support development.
          <br />
          Learn more about implementing Picorules in your organization.
        </footer>
      </main>
    </div>
  );
}

export default App;
