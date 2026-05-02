import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { AlertTriangle, Users, TrendingUp, ShieldCheck } from 'lucide-react';

const GATEWAY_URL = "http://localhost:8000/api/v1";

const HRMDashboard = () => {
  const [riskData, setRiskData] = useState([]);
  const [stats, setStats] = useState({ total_devs: 0, high_risk: 0, avg_satisfaction: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrgData = async () => {
      try {
        const resp = await axios.get(`${GATEWAY_URL}/analytics/org/health`);
        setRiskData(resp.data.team_risks || []);
        setStats(resp.data.summary || { total_devs: 0, high_risk: 0, avg_satisfaction: 0 });
      } catch (e) {
        console.error("HRM Data fetch failed", e);
      } finally {
        setLoading(false);
      }
    };
    fetchOrgData();
  }, []);

  if (loading) return <div className="animate-fade"><h3>Analyzing Team Health...</h3></div>;

  return (
    <div className="dashboard-grid animate-fade">
      <div className="span-full welcome-banner hrm-banner glass-card">
        <div>
          <h1>Organizational Health <ShieldCheck className="accent-icon" /></h1>
          <p className="text-secondary">AI-driven attrition and burnout prevention.</p>
        </div>
      </div>

      <div className="glass-card risk-chart">
        <h3>Attrition Risk Heatmap</h3>
        <div style={{ width: '100%', height: 300 }}>
          {riskData.length > 0 ? (
            <ResponsiveContainer>
              <BarChart data={riskData}>
                <XAxis dataKey="name" stroke="#525252" fontSize={12} />
                <YAxis stroke="#525252" fontSize={12} />
                <Tooltip contentStyle={{ backgroundColor: '#161616', borderColor: '#262626' }} />
                <Bar dataKey="risk">
                  {riskData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.risk > 70 ? '#ef4444' : '#3b82f6'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-state">No risk assessments available yet.</div>
          )}
        </div>
      </div>

      <div className="glass-card stat-cards">
        <div className="mini-card">
          <Users className="accent-icon" />
          <h4>{stats.total_devs}</h4>
          <p>Total Developers</p>
        </div>
        <div className="mini-card danger">
          <AlertTriangle className="accent-red" />
          <h4>{stats.high_risk}</h4>
          <p>High Burnout Risk</p>
        </div>
        <div className="mini-card">
          <TrendingUp className="accent-green" />
          <h4>{stats.avg_satisfaction}%</h4>
          <p>Avg Satisfaction</p>
        </div>
      </div>
    </div>
  );
};

export default HRMDashboard;
