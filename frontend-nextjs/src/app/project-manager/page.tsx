'use client';

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { AlertTriangle, Users, TrendingUp, LayoutDashboard, GanttChart } from 'lucide-react';

const GATEWAY_URL = "http://localhost:8000/api/v1";

export default function ProjectManagerDashboard() {
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
        console.error("PM Data fetch failed", e);
      } finally {
        setLoading(false);
      }
    };
    fetchOrgData();
  }, []);

  if (loading) return <div className="p-10 text-center animate-pulse font-mono text-blue-500">SYNCHRONIZING TEAM DATA...</div>;

  return (
    <div className="grid grid-cols-12 gap-6 animate-fade p-6 bg-black min-h-screen">
      <div className="col-span-12 p-10 glass-card bg-gradient-to-r from-blue-500/10 to-transparent">
        <h1 className="text-4xl font-bold mb-2 flex items-center gap-4">
          Project Management Console <LayoutDashboard className="text-blue-500" />
        </h1>
        <p className="text-gray-400">Holistic delivery monitoring and velocity optimization for ADT-linked teams.</p>
      </div>

      <div className="col-span-12 lg:col-span-8 p-8 glass-card">
        <h3 className="text-lg font-bold mb-8 flex items-center gap-2">
            <GanttChart size={20} className="text-blue-500" /> Team Delivery & Burnout Risk
        </h3>
        <div className="h-[300px]">
          {riskData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={riskData}>
                <XAxis dataKey="name" stroke="#3f3f46" fontSize={10} />
                <YAxis stroke="#3f3f46" fontSize={10} />
                <Tooltip contentStyle={{ backgroundColor: '#09090b', border: '1px solid #27272a' }} />
                <Bar dataKey="risk">
                  {riskData.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.risk > 70 ? '#ef4444' : '#3b82f6'} fillOpacity={0.8} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-600 italic">Gathering team telemetry...</div>
          )}
        </div>
      </div>

      <div className="col-span-12 lg:col-span-4 space-y-6">
        <div className="p-6 glass-card flex items-center gap-6">
          <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center">
            <Users className="text-blue-500" />
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Active Twins</p>
            <p className="text-3xl font-bold">{stats.total_devs}</p>
          </div>
        </div>

        <div className="p-6 glass-card flex items-center gap-6 border-l-4 border-red-500/50">
          <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center">
            <AlertTriangle className="text-red-500" />
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">High Risk Tokens</p>
            <p className="text-3xl font-bold">{stats.high_risk}</p>
          </div>
        </div>

        <div className="p-6 glass-card flex items-center gap-6 border-l-4 border-green-500/50">
          <div className="w-12 h-12 rounded-2xl bg-green-500/10 flex items-center justify-center">
            <TrendingUp className="text-green-500" />
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Squad Velocity</p>
            <p className="text-3xl font-bold">{stats.avg_satisfaction}%</p>
          </div>
        </div>
      </div>
    </div>
  );
}
