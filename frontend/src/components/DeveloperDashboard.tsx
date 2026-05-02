import React from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, AreaChart, Area } from 'recharts';
import { Award, Zap, Clock, Code } from 'lucide-react';

const data = [
  { subject: 'Backend', A: 120, fullMark: 150 },
  { subject: 'Frontend', A: 98, fullMark: 150 },
  { subject: 'DevOps', A: 86, fullMark: 150 },
  { subject: 'ML/AI', A: 99, fullMark: 150 },
  { subject: 'Database', A: 85, fullMark: 150 },
  { subject: 'Security', A: 65, fullMark: 150 },
];

const activityData = [
  { name: 'Mon', wpm: 45, commits: 12 },
  { name: 'Tue', wpm: 52, commits: 18 },
  { name: 'Wed', wpm: 48, commits: 15 },
  { name: 'Thu', wpm: 61, commits: 22 },
  { name: 'Fri', wpm: 55, commits: 10 },
];

const DeveloperDashboard = () => {
  return (
    <div className="dashboard-grid animate-fade">
      <div className="span-full welcome-banner glass-card">
        <div>
          <h1>The Ladder Climb <Award className="accent-icon" /></h1>
          <p className="text-secondary">Level 14 Senior Architect. 2,400 XP to next rank.</p>
        </div>
        <div className="rank-badge">Elite Tier</div>
      </div>

      <div className="glass-card skill-radar">
        <h3>Skill Proficiencies</h3>
        <div style={{ width: '100%', height: 300 }}>
          <ResponsiveContainer>
            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
              <PolarGrid stroke="#262626" />
              <PolarAngleAxis dataKey="subject" tick={{ fill: '#a0a0a0', fontSize: 12 }} />
              <Radar name="Skills" dataKey="A" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.5} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="glass-card stats-overview">
        <h3>Productivity Trends</h3>
        <div style={{ width: '100%', height: 300 }}>
          <ResponsiveContainer>
            <AreaChart data={activityData}>
              <defs>
                <linearGradient id="colorWpm" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="name" stroke="#525252" fontSize={12} />
              <Tooltip contentStyle={{ backgroundColor: '#161616', borderColor: '#262626' }} />
              <Area type="monotone" dataKey="wpm" stroke="#3b82f6" fillOpacity={1} fill="url(#colorWpm)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="glass-card mini-stats">
        <div className="stat-item">
          <Zap className="accent-icon" />
          <div>
            <p className="label">Avg WPM</p>
            <p className="value">58</p>
          </div>
        </div>
        <div className="stat-item">
          <Clock className="accent-icon" />
          <div>
            <p className="label">Active Hours</p>
            <p className="value">38.5h</p>
          </div>
        </div>
        <div className="stat-item">
          <Code className="accent-icon" />
          <div>
            <p className="label">Lines Authored</p>
            <p className="value">12.4k</p>
          </div>
        </div>
      </div>
      
      <div className="glass-card active-tasks">
        <h3>Active Assignments</h3>
        <div className="task-list">
          <div className="task-row">
            <span className="task-title">Migrate Auth to MongoDB</span>
            <span className="status-chip in-progress">In Progress</span>
          </div>
          <div className="task-row">
            <span className="task-title">Optimize Bayesian Fusion</span>
            <span className="status-chip review">In Review</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeveloperDashboard;
