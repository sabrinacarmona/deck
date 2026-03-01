import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { Playbar } from './components/Playbar';
import { MainContent } from './components/MainContent';
import { SearchModal } from './components/SearchModal';
import Login from './components/Login';
import { getToken } from './api/auth';
import './App.css';

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
        <MainContent />
      </div>
      <Playbar />
      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </div>
  );
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
