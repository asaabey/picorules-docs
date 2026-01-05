import { useState, useEffect, useCallback } from 'react';
import { docs } from '../docs';

export type Route =
  | { type: 'landing' }
  | { type: 'doc'; docId: string };

function parseHash(): Route {
  const hash = window.location.hash;

  // No hash or just # = landing page
  if (!hash || hash === '#' || hash === '#/') {
    return { type: 'landing' };
  }

  // Support legacy #doc-{id} format and redirect
  if (hash.startsWith('#doc-')) {
    const docId = hash.replace('#doc-', '');
    const validDoc = docs.find((d) => d.id === docId);
    if (validDoc) {
      // Redirect to new format
      window.location.hash = `#/${docId}`;
      return { type: 'doc', docId };
    }
  }

  // Parse /#/{docId} format
  const match = hash.match(/^#\/(.+)$/);
  if (match) {
    const docId = match[1];
    // Validate that docId exists
    const validDoc = docs.find((d) => d.id === docId);
    if (validDoc) {
      return { type: 'doc', docId };
    }
  }

  // Invalid hash, default to landing
  return { type: 'landing' };
}

export function useHashRouter() {
  const [route, setRoute] = useState<Route>(parseHash);

  useEffect(() => {
    const handleHashChange = () => {
      setRoute(parseHash());
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const navigate = useCallback((newRoute: Route) => {
    if (newRoute.type === 'landing') {
      // Remove hash entirely for clean landing URL
      history.pushState(null, '', window.location.pathname);
      setRoute(newRoute);
    } else {
      window.location.hash = `#/${newRoute.docId}`;
      // hashchange event will update state
    }
  }, []);

  return { route, navigate };
}
