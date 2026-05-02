'use client';

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer, AreaChart, Area, XAxis, Tooltip } from 'recharts';
import { Award, Zap, Clock, Code } from 'lucide-react';

const GATEWAY_URL = "http://localhost:8000/api/v1";

export default function DeveloperDashboard() {
  const [skills, setSkills] = useState([]);
  const [metrics, setMetrics] = useState({ wpm: 0, active_hours: 0, lines: 0 });
  const [account, setAccount] = useState({ userId: "...", extensionId: "..." });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userId = "admin_user"; 
        const skillResp = await axios.get(`${GATEWAY_URL}/thg/thg/${userId}/skills`);
        setSkills(skillResp.data.skills.map((s: any) => ({ subject: s.name, A: s.strength * 100 })));
        
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

  if (loading) return <div className="p-10 text-center animate-pulse">Initializing Digital Twin...</div>;

  return (
    <div className="grid grid-cols-12 gap-6 animate-fade">
      {/* Welcome Banner */}
      <div className="col-span-12 p-10 glass-card bg-gradient-to-r from-blue-500/10 to-purple-500/10 flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold mb-2 flex items-center gap-4">
            The Ladder Climb <Award className="text-yellow-500" />
          </h1>
          <p className="text-gray-400">Track your professional evolution across the office network.</p>
          <div className="mt-6 flex gap-8">
            <div className="bg-black/40 px-4 py-2 rounded-lg border border-white/5">
                <span className="text-[10px] text-gray-500 uppercase block mb-1">User ID</span>
                <code className="text-blue-400 font-bold">{account.userId}</code>
            </div>
            <div className="bg-black/40 px-4 py-2 rounded-lg border border-white/5">
                <span className="text-[10px] text-gray-500 uppercase block mb-1">Extension ID</span>
                <code className="text-purple-400 font-bold">{account.extensionId}</code>
            </div>
          </div>
        </div>
        <div className="bg-blue-500 text-white px-6 py-2 rounded-full font-bold shadow-lg shadow-blue-500/30">
            Elite Tier
        </div>
      </div>

      {/* Skills Radar */}
      <div className="col-span-12 lg:col-span-4 p-8 glass-card">
        <h3 className="text-lg font-bold mb-8">Live Skill Matrix</h3>
        <div className="h-[300px]">
          {skills.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={skills}>
                <PolarGrid stroke="#262626" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#6b7280', fontSize: 10 }} />
                <Radar name="Skills" dataKey="A" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.5} />
              </RadarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-600 text-sm italic">
                No telemetry fused yet.
            </div>
          )}
        </div>
      </div>

      {/* Activity Area */}
      <div className="col-span-12 lg:col-span-5 p-8 glass-card">
        <h3 className="text-lg font-bold mb-8">Productivity Velocity</h3>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={[]}>
              <XAxis dataKey="name" stroke="#3f3f46" fontSize={10} />
              <Tooltip contentStyle={{ backgroundColor: '#09090b', border: '1px solid #27272a' }} />
              <Area type="monotone" dataKey="wpm" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.1} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="col-span-12 lg:col-span-3 space-y-6">
        <div className="p-6 glass-card flex items-center gap-6">
          <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center">
            <Zap className="text-blue-500" />
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase">Avg WPM</p>
            <p className="text-2xl font-bold">{metrics.wpm || 0}</p>
          </div>
        </div>

        <div className="p-6 glass-card flex items-center gap-6">
          <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center">
            <Clock className="text-purple-500" />
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase">Active Hours</p>
            <p className="text-2xl font-bold">{metrics.active_hours || 0}h</p>
          </div>
        </div>

        <div className="p-6 glass-card flex items-center gap-6">
          <div className="w-12 h-12 rounded-2xl bg-green-500/10 flex items-center justify-center">
            <Code className="text-green-500" />
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase">Code Impacts</p>
            <p className="text-2xl font-bold">{metrics.lines || 0}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
