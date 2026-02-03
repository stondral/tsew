"use client";

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Cell, CartesianGrid } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTheme } from "@/components/ThemeProvider";

interface RevenueChartProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data?: any[];
}

export function RevenueChart({ data: propData }: RevenueChartProps) {
  const { theme } = useTheme();
  
  const chartData = propData || [
    { name: "Mon", total: 4500 },
    { name: "Tue", total: 5200 },
    { name: "Wed", total: 4800 },
    { name: "Thu", total: 6100 },
    { name: "Fri", total: 5900 },
    { name: "Sat", total: 7200 },
    { name: "Sun", total: 6800 },
  ];

  const totalValue = chartData.reduce((sum, item) => sum + item.total, 0);

  return (
    <Card className="col-span-1 border border-slate-100 dark:border-slate-800 shadow-xl dark:shadow-black/20 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-[2.5rem] overflow-hidden transition-colors duration-300">
      <CardHeader className="p-8 pb-4 flex flex-row items-center justify-between border-b border-slate-50 dark:border-slate-800">
        <div>
          <CardTitle className="text-xl font-black tracking-tight text-slate-900 dark:text-slate-100">Revenue Flow</CardTitle>
          <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 mt-1 uppercase tracking-[0.2em]">Weekly Performance Insight</p>
        </div>
        <div className="flex items-center gap-4">
             <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.4)]" />
                <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-tighter">Current Period</span>
             </div>
        </div>
      </CardHeader>
      <CardContent className="p-8 pt-10">
        <div className="flex items-end gap-2 mb-10">
            <span className="text-4xl font-black text-slate-900 dark:text-white tabular-nums">₹{totalValue.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
            <span className="text-[10px] font-black text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-1 rounded-lg mb-1.5 uppercase tracking-wider">+12.5% vs LW</span>
        </div>
        
        <div className="h-[320px] w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                <defs>
                    <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#FB923C" stopOpacity={1} />
                        <stop offset="100%" stopColor="#F59E00" stopOpacity={1} />
                    </linearGradient>
                </defs>
                <CartesianGrid 
                  strokeDasharray="3 3" 
                  vertical={false} 
                  stroke={theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'} 
                />
                <XAxis
                  dataKey="name"
                  stroke={theme === 'dark' ? '#475569' : '#94A3B8'}
                  fontSize={10}
                  fontWeight={900}
                  tickLine={false}
                  axisLine={false}
                  dy={15}
                />
                <YAxis
                  stroke={theme === 'dark' ? '#475569' : '#94A3B8'}
                  fontSize={10}
                  fontWeight={900}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `₹${value}`}
                  hide
                />
                <Tooltip 
                cursor={{ fill: theme === 'dark' ? 'rgba(255, 255, 255, 0.03)' : 'rgba(245, 158, 11, 0.05)', radius: 12 }}
                content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                    return (
                        <div className="bg-slate-900 dark:bg-black p-4 rounded-2xl shadow-2xl border border-white/10 backdrop-blur-xl">
                            <p className="text-[10px] font-black text-slate-400 mb-1 uppercase tracking-[0.2em]">{payload[0].payload.name}</p>
                            <p className="text-lg font-black text-amber-500">₹{payload[0].value}</p>
                        </div>
                    );
                    }
                    return null;
                }}
                />
                <Bar
                dataKey="total"
                radius={[12, 12, 12, 12]}
                barSize={32}
                >
                    {chartData.map((entry, index) => (
                        <Cell 
                            key={`cell-${index}`} 
                            fill={index === chartData.length -1 ? 'url(#barGradient)' : (theme === 'dark' ? '#1E293B' : '#F1F5F9')} 
                            style={{ 
                                filter: index === chartData.length -1 ? 'drop-shadow(0 10px 15px rgba(245, 158, 11, 0.3))' : 'none',
                                transition: 'all 0.3s ease'
                            }}
                            className="hover:fill-amber-500/50 transition-colors"
                        />
                    ))}
                </Bar>
            </BarChart>
            </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
