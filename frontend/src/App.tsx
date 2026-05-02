import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, ClipboardList, Settings, Activity } from 'lucide-react';
import './App.css';

import DeveloperDashboard from './components/DeveloperDashboard';
import HRMDashboard from './components/HRMDashboard';
import LandingPage from './pages/LandingPage';
import DeveloperOnboarding from './pages/DeveloperOnboarding';
import RegistrationPage from './pages/RegistrationPage';
import LoginPage from './pages/LoginPage';

const Sidebar = () => {
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path;

  // Don't show sidebar on landing/auth pages
  const authPages = ['/', '/onboarding/developer', '/register', '/login'];
  if (authPages.includes(location.pathname)) return null;

  return (
    <div className="sidebar">
      <div className="logo">
        <Activity className="accent-icon" />
        <span className="gradient-text">ADT v1</span>
      </div>
      <nav>
        <Link to="/dashboard" className={isActive('/dashboard') ? 'active' : ''}>
          <LayoutDashboard size={20} /> <span>My Twin</span>
        </Link>
        <Link to="/hrm" className={isActive('/hrm') ? 'active' : ''}>
          <Users size={20} /> <span>HRM Panel</span>
        </Link>
        <Link to="/senior" className={isActive('/senior') ? 'active' : ''}>
          <ClipboardList size={20} /> <span>Orchestration</span>
        </Link>
      </nav>
      <div className="profile-mini">
        <div className="avatar">SV</div>
        <div className="info">
          <p className="name">Live Session</p>
          <p className="role">Active Participant</p>
        </div>
      </div>
    </div>
  );
};

const Header = () => {
  const location = useLocation();
  const authPages = ['/', '/onboarding/developer', '/register', '/login'];
  if (authPages.includes(location.pathname)) return null;

  return (
    <header className="top-header">
      <div className="search-bar">
        <input type="text" placeholder="Search insights..." />
      </div>
      <div className="header-actions">
        <div className="status-badge">
          <span className="dot pulse"></span> Monitoring Active
        </div>
      </div>
    </header>
  );
};

function App() {
  return (
    <Router>
      <div className="app-layout">
        <Sidebar />
        <div className="main-content">
          <Header />
          <div className="view-container">
            <Routes>
              {/* Onboarding Flow */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/onboarding/developer" element={<DeveloperOnboarding />} />
              <Route path="/register" element={<RegistrationPage />} />
              <Route path="/login" element={<LoginPage />} />

              {/* Protected Dashboards */}
              <Route path="/dashboard" element={<DeveloperDashboard />} />
              <Route path="/hrm" element={<HRMDashboard />} />
              <Route path="/senior" element={<div>Senior Manager Orchestration Panel</div>} />
              <Route path="/tech" element={<div>Tech Support Administration</div>} />
            </Routes>
          </div>
        </div>
      </div>
    </Router>
  );
}

export default App;
