import { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Playbar } from './components/Playbar';
import { MainContent } from './components/MainContent';
import { SearchModal } from './components/SearchModal';
import { login, getToken, getAccessToken } from './api/auth';

function App() {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');

    if (code) {
      getAccessToken(code).then((token) => {
        if (token) {
          setIsAuthenticated(true);
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      });
    } else if (getToken()) {
      setIsAuthenticated(true);
    }
  }, []);

  if (!isAuthenticated) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', alignItems: 'center', justifyContent: 'center', background: '#050505', color: '#fff' }}>
        <h1 style={{ marginBottom: 24, fontSize: 32, fontWeight: 700 }}>Deck</h1>
        <button
          onClick={login}
          style={{ background: '#fff', color: '#000', border: 'none', padding: '12px 24px', borderRadius: 24, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
        >
          Connect to Spotify
        </button>
      </div>
    );
  }

  return (
    <div className="app-container">
      <div className="main-layout">
        <Sidebar onSearchClick={() => setIsSearchOpen(true)} />
        <MainContent />
      </div>
      <Playbar />
      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </div>
  );
}

export default App;
