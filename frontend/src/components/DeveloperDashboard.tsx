import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer, AreaChart, Area, XAxis, Tooltip } from 'recharts';
import { Award, Zap, Clock, Code } from 'lucide-react';

const GATEWAY_URL = "http://localhost:8000/api/v1";

const DeveloperDashboard = () => {
  const [skills, setSkills] = useState([]);
  const [metrics, setMetrics] = useState({ wpm: 0, active_hours: 0, lines: 0 });
  const [account, setAccount] = useState({ userId: "...", extensionId: "..." });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userId = "admin_user"; 
        const skillResp = await axios.get(`${GATEWAY_URL}/thg/thg/${userId}/skills`);
        setSkills(skillResp.data.skills.map(s => ({ subject: s.name, A: s.strength * 100 })));
        
        const statsResp = await axios.get(`${GATEWAY_URL}/analytics/stats/${userId}/summary`);
        setMetrics(statsResp.data);
        
        setAccount({ userId: userId, extensionId: "ext_active" });
      } catch (e) {
        console.error("Failed to fetch live data", e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <div className="animate-fade"><h3>Synchronizing Twin...</h3></div>;

  return (
    <div className="dashboard-grid animate-fade">
      <div className="span-full welcome-banner glass-card">
        <div>
          <h1>Your Ladder Climb <Award className="accent-icon" /></h1>
          <p className="text-secondary">Track your professional evolution in real-time.</p>
          <div className="account-ids">
            <span>User ID: <code className="accent-primary">{account.userId}</code></span>
            <span style={{marginLeft: '20px'}}>Extension ID: <code className="accent-secondary">{account.extensionId}</code></span>
          </div>
        </div>
      </div>

      <div className="glass-card skill-radar">
        <h3>Live Skill Proficiency</h3>
        <div style={{ width: '100%', height: 300 }}>
          {skills.length > 0 ? (
            <ResponsiveContainer>
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={skills}>
                <PolarGrid stroke="#262626" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#a0a0a0', fontSize: 12 }} />
                <Radar name="Skills" dataKey="A" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.5} />
              </RadarChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-state">No skill data fused yet. Start coding to seed your graph.</div>
          )}
        </div>
      </div>

      <div className="glass-card stats-overview">
        <h3>Productivity Momentum</h3>
        <div style={{ width: '100%', height: 300 }}>
          <ResponsiveContainer>
            <AreaChart data={[]}>
              <XAxis dataKey="name" stroke="#525252" fontSize={12} />
              <Tooltip contentStyle={{ backgroundColor: '#161616', borderColor: '#262626' }} />
              <Area type="monotone" dataKey="wpm" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="glass-card mini-stats">
        <div className="stat-item">
          <Zap className="accent-icon" />
          <div>
            <p className="label">Current WPM</p>
            <p className="value">{metrics.wpm || 0}</p>
          </div>
        </div>
        <div className="stat-item">
          <Clock className="accent-icon" />
          <div>
            <p className="label">Focus Hours</p>
            <p className="value">{metrics.active_hours || 0}h</p>
          </div>
        </div>
        <div className="stat-item">
          <Code className="accent-icon" />
          <div>
            <p className="label">Code Impact</p>
            <p className="value">{metrics.lines || 0}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeveloperDashboard;
