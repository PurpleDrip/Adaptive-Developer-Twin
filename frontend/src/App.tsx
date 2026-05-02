import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, ClipboardList, Settings, Activity, Award } from 'lucide-react';
import './App.css';

import DeveloperDashboard from './components/DeveloperDashboard';
import HRMDashboard from './components/HRMDashboard';

// Lazy load placeholders for remaining
const SeniorDevDashboard = () => <div className="animate-fade"><h2>Project Orchestration</h2><p>3 tasks awaiting assignment. Top candidates identified.</p></div>;
const MonitoringDashboard = () => <div className="animate-fade"><h2>System Monitoring</h2><p>All 8 microservices are operational. Audit trail is clean.</p></div>;

const Sidebar = () => {
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="sidebar">
      <div className="logo">
        <Activity className="accent-icon" />
        <span className="gradient-text">ADT v1</span>
      </div>
      <nav>
        <Link to="/" className={isActive('/') ? 'active' : ''}>
          <LayoutDashboard size={20} /> <span>Developer</span>
        </Link>
        <Link to="/hrm" className={isActive('/hrm') ? 'active' : ''}>
          <Users size={20} /> <span>HRM Analytics</span>
        </Link>
        <Link to="/senior" className={isActive('/senior') ? 'active' : ''}>
          <ClipboardList size={20} /> <span>Senior Dev</span>
        </Link>
        <Link to="/monitoring" className={isActive('/monitoring') ? 'active' : ''}>
          <Settings size={20} /> <span>Monitoring</span>
        </Link>
      </nav>
      <div className="profile-mini">
        <div className="avatar">SV</div>
        <div className="info">
          <p className="name">Shashanth Vemuri</p>
          <p className="role">Senior Architect</p>
        </div>
      </div>
    </div>
  );
};

function App() {
  return (
    <Router>
      <div className="app-container">
        <Sidebar />
        <main className="content">
          <header className="top-header">
            <div className="search-bar">
              <input type="text" placeholder="Search developers, tasks, or insights..." />
            </div>
            <div className="header-actions">
              <div className="status-badge">
                <span className="dot pulse"></span> Monitoring Active
              </div>
            </div>
          </header>
          <div className="page-content">
            <Routes>
              <Route path="/" element={<DeveloperDashboard />} />
              <Route path="/hrm" element={<HRMDashboard />} />
              <Route path="/senior" element={<SeniorDevDashboard />} />
              <Route path="/monitoring" element={<MonitoringDashboard />} />
            </Routes>
          </div>
        </main>
      </div>
    </Router>
  );
}

export default App;
