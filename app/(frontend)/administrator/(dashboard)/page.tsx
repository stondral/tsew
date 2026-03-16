"use client";

import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import {
  Settings, Share2, PauseCircle, ChevronDown
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer
} from "recharts";
import { motion } from "motion/react";
import { useTheme } from "@/components/ThemeProvider";

export default function AdminDashboard() {
  const { theme } = useTheme();
  const [stats, setStats] = useState<Record<string, any> | null>(null); // eslint-disable-line @typescript-eslint/no-explicit-any
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("Analytics");

  useEffect(() => {
    fetch("/api/admin/customer-orders?type=summary")
      .then((r) => r.json())
      .then((d) => setStats(d))
      .catch((err) => console.error("Dashboard fetch error:", err))
      .finally(() => setLoading(false));
  }, []);

  const tabs = ["Analytics", "Leads", "Sequences", "Schedule", "Options", "Subsequences"];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 border-4 border-indigo-500/20 rounded-full" />
          <div className="absolute inset-0 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 pb-12"
    >
      {/* Top Tabs Navigation */}
      <div className="flex border-b border-slate-200 dark:border-slate-800/60 overflow-x-auto no-scrollbar">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-4 text-sm font-semibold transition-all relative shrink-0 ${
              activeTab === tab ? "text-indigo-600 dark:text-indigo-400" : "text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-200"
            }`}
          >
            {tab}
            {activeTab === tab && (
              <motion.div 
                layoutId="activeTabIndicator"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]" 
              />
            )}
          </button>
        ))}
      </div>

      {/* Sub Header / Control Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 py-2">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-indigo-500/10 border border-indigo-500/20 rounded-full">
            <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
            <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">Active</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-24 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: '12%' }} />
            </div>
            <span className="text-[10px] font-bold text-slate-500 uppercase">12% Growth</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800/40 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors border border-slate-200 dark:border-slate-700/50 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 shadow-sm">
                <PauseCircle className="w-4 h-4" /> Pause Ops
            </button>
            <div className="hidden sm:flex items-center gap-2 px-3 py-2 bg-white dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/50 rounded-xl shadow-sm">
                <Share2 className="w-4 h-4 text-slate-400" />
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Share</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/50 rounded-xl cursor-pointer hover:border-slate-300 dark:hover:border-slate-600 transition-colors shadow-sm">
                <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">Sep 1 - Sep 11</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
            </div>
            <button className="p-2 bg-white dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/50 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm">
                <Settings className="w-4 h-4 text-slate-400" />
            </button>
        </div>
      </div>

      {/* Main Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: "Gross Revenue", value: `₹${(stats?.totalRevenue || 0).toLocaleString()}`, sub: `₹${((stats?.totalRevenue || 0) * 0.8).toLocaleString()}`, color: "indigo" },
          { label: "Total Orders", value: stats?.totalOrders || 0, sub: "Live", color: "emerald" },
          { label: "Lead Pipeline", value: stats?.totalLeads || 0, sub: `${stats?.totalUsers || 0} Users`, color: "blue" },
          { label: "Pending Veto", value: stats?.pendingProducts || 0, sub: "Action Required", color: "amber" },
          { label: "Support Hits", value: stats?.activeTickets || 0, sub: "98% Res.", color: "rose" },
        ].map((s, i) => (
          <Card key={i} className="p-5 border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f172a]/40 backdrop-blur-xl relative overflow-hidden group hover:border-indigo-500/40 transition-all duration-300 shadow-sm dark:shadow-none">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">{s.label}</p>
            <div className="flex items-baseline gap-2">
                <h3 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">{s.value}</h3>
                <span className="text-[10px] font-bold text-slate-400">| {s.sub}</span>
            </div>
            <div className={`absolute bottom-0 left-0 h-1 bg-${s.color}-500 opacity-20 w-full`} />
          </Card>
        ))}
      </div>

      {/* Chart Section */}
      <Card className="p-6 border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f172a]/40 backdrop-blur-xl shadow-sm dark:shadow-none">
        <div className="flex items-center justify-between mb-8 overflow-x-auto no-scrollbar gap-4">
          <div className="flex gap-4 shrink-0">
            <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]" />
                <span className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400">Sales Growth</span>
            </div>
            <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                <span className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400">Active Sessions</span>
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
              {["Daily", "Weekly", "Monthly"].map((p) => (
                  <button key={p} className={`text-[10px] font-black px-3 py-1 rounded-lg transition-colors ${p === 'Weekly' ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}>
                      {p}
                  </button>
              ))}
          </div>
        </div>
        
        <div className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={stats?.chartData || []}>
              <defs>
                <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === 'dark' ? '#1e293b' : '#e2e8f0'} />
              <XAxis 
                dataKey="name" 
                stroke="#64748b" 
                fontSize={10} 
                axisLine={false} 
                tickLine={false}
                tick={{ dy: 10 }}
              />
              <YAxis 
                stroke="#64748b" 
                fontSize={10} 
                axisLine={false} 
                tickLine={false}
                tick={{ dx: -10 }}
              />
              <Tooltip 
                contentStyle={{ 
                    backgroundColor: theme === 'dark' ? 'rgba(15, 23, 42, 0.9)' : 'rgba(255, 255, 255, 0.9)', 
                    border: theme === 'dark' ? '1px solid #1e293b' : '1px solid #e2e8f0', 
                    borderRadius: '16px',
                    backdropFilter: 'blur(8px)',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                }}
                labelStyle={{ color: theme === 'dark' ? '#fff' : '#0f172a', fontSize: '12px', fontWeight: 'bold', marginBottom: '8px' }}
                itemStyle={{ color: '#64748b', fontSize: '11px', fontWeight: '600', padding: '2px 0' }}
              />
              <Area 
                type="monotone" 
                dataKey="sales" 
                stroke="#6366f1" 
                strokeWidth={4} 
                fillOpacity={1} 
                fill="url(#colorSales)"
                animationDuration={2000}
              />
              <Area 
                type="monotone" 
                dataKey="users" 
                stroke="#10b981" 
                strokeWidth={4} 
                fillOpacity={1} 
                fill="url(#colorUsers)"
                animationDuration={2500}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Footer System Status */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800/60">
        <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-tighter">Engine Health: Optimal</span>
        </div>
        <div className="text-[10px] font-bold text-slate-400 dark:text-slate-600 uppercase">
            Build v{process.env.NEXT_PUBLIC_APP_VERSION || "27.7.0"}
        </div>
      </div>
    </motion.div>
  );
}
