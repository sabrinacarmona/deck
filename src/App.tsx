import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { Playbar } from './components/Playbar';
import { MainContent } from './components/MainContent';
import { PlaylistView } from './components/PlaylistView';
import { LikedSongs } from './components/LikedSongs';
import { SearchModal } from './components/SearchModal';
import Login from './components/Login';
import { getToken } from './api/auth';
import { X } from 'lucide-react';

import { PlayerProvider, usePlayer } from './contexts/PlayerContext';

const ErrorToast = () => {
  const { error, clearError } = usePlayer();

  React.useEffect(() => {
    if (error) {
      const timer = setTimeout(clearError, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, clearError]);

  if (!error) return null;

  return (
    <div className="error-toast">
      <span style={{ fontWeight: 600 }}>Action Failed: </span> {error}
      <button onClick={clearError} className="close-toast-btn">
        <X size={16} />
      </button>
    </div>
  );
};

const ProtectedRoute = ({ children }: { children: React.ReactElement }) => {
  const token = getToken();
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

const Dashboard = () => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  return (
    <div className="app-container">
      <div className="main-layout">
        <Sidebar onSearchClick={() => setIsSearchOpen(true)} />
        <Routes>
          <Route path="/" element={<MainContent />} />
          <Route path="/playlist/:id" element={<PlaylistView />} />
          <Route path="/liked-songs" element={<LikedSongs />} />
        </Routes>
      </div>
      <Playbar />
      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
      <ErrorToast />
    </div>
  );
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <PlayerProvider>
                <Dashboard />
              </PlayerProvider>
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
