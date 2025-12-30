import { useEffect, useMemo, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { docs } from './docs';
import './App.css';

function App() {
  const [selectedDocId, setSelectedDocId] = useState(docs[0].id);
  const [query, setQuery] = useState('');

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

  const activeDoc =
    docs.find((doc) => doc.id === selectedDocId) ?? docs[0];

  return (
    <div className="docs-app">
      <aside className="sidebar">
        <header className="sidebar__header">
          <p className="eyebrow">Picorules Language</p>
          <h1>The Picorules Book</h1>
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
      </aside>
      <main className="content">
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
