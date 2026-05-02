import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { AlertTriangle, TrendingUp, TrendingDown, UserPlus } from 'lucide-react';

const burnoutData = [
  { name: 'Engineering', risk: 85, color: '#ef4444' },
  { name: 'Design', risk: 45, color: '#f59e0b' },
  { name: 'Product', risk: 30, color: '#10b981' },
  { name: 'Sales', risk: 20, color: '#10b981' },
];

const suggestions = [
  { name: 'Shashanth Vemuri', action: 'Promote', reason: 'High self-awareness & technical peak.', type: 'positive' },
  { name: 'John Doe', action: 'Coaching', reason: 'Declining WPM & cognitive jitter.', type: 'warning' },
  { name: 'Jane Smith', action: 'Maintain', reason: 'Stable performance metrics.', type: 'neutral' },
];

const HRMDashboard = () => {
  return (
    <div className="dashboard-grid animate-fade">
      <div className="glass-card span-2">
        <h3>Burnout Risk by Department</h3>
        <div style={{ width: '100%', height: 300 }}>
          <ResponsiveContainer>
            <BarChart data={burnoutData}>
              <XAxis dataKey="name" stroke="#525252" fontSize={12} />
              <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ backgroundColor: '#161616', borderColor: '#262626' }} />
              <Bar dataKey="risk">
                {burnoutData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="glass-card suggestions-list">
        <h3>AI Insights & Suggestions</h3>
        <div className="suggestions-container">
          {suggestions.map((s, i) => (
            <div key={i} className={`suggestion-card ${s.type}`}>
              <div className="suggestion-header">
                <strong>{s.name}</strong>
                <span className={`action-badge ${s.type}`}>{s.action}</span>
              </div>
              <p className="text-secondary">{s.reason}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="glass-card mini-stats">
        <div className="stat-item">
          <TrendingUp className="accent-success" />
          <div>
            <p className="label">Team Morale</p>
            <p className="value">8.4/10</p>
          </div>
        </div>
        <div className="stat-item">
          <AlertTriangle className="accent-danger" />
          <div>
            <p className="label">Burnout Alerts</p>
            <p className="value">2 High Risk</p>
          </div>
        </div>
        <div className="stat-item">
          <UserPlus className="accent-primary" />
          <div>
            <p className="label">Open Positions</p>
            <p className="value">4</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HRMDashboard;
