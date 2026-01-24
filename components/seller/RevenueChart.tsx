"use client";

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Cell } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";


interface RevenueChartProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data?: any[];
}

export function RevenueChart({ data: propData }: RevenueChartProps) {
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
    <Card className="col-span-1 border border-slate-100 shadow-2xl shadow-slate-200/50 bg-white/80 backdrop-blur-md rounded-[2rem] overflow-hidden">
      <CardHeader className="p-8 pb-4 flex flex-row items-center justify-between border-b border-slate-50">
        <div>
          <CardTitle className="text-xl font-black tracking-tight text-slate-900">Revenue Flow</CardTitle>
          <p className="text-sm font-bold text-slate-400 mt-1 uppercase tracking-widest">Weekly Performance Insight</p>
        </div>
        <div className="flex items-center gap-4">
             <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.4)]" />
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-tighter">Current Period</span>
             </div>
        </div>
      </CardHeader>
      <CardContent className="p-8 pt-10">
        <div className="flex items-end gap-1 mb-8">
            <span className="text-4xl font-black text-slate-900 tabular-nums">₹{totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            <span className="text-xs font-black text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-md mb-1.5">+12.5%</span>
        </div>
        
        <div className="h-[300px] w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                <defs>
                    <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#FB923C" stopOpacity={1} />
                        <stop offset="100%" stopColor="#F59E00" stopOpacity={1} />
                    </linearGradient>
                </defs>
                <XAxis
                dataKey="name"
                stroke="#94A3B8"
                fontSize={10}
                fontWeight={900}
                tickLine={false}
                axisLine={false}
                dy={15}
                />
                <YAxis
                stroke="#94A3B8"
                fontSize={10}
                fontWeight={900}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `₹${value}`}
                hide
                />
                <Tooltip 
                cursor={{ fill: 'rgba(245, 158, 11, 0.05)', radius: 12 }}
                content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                    return (
                        <div className="bg-slate-900 p-4 rounded-2xl shadow-2xl border-none ring-1 ring-white/10 backdrop-blur-xl">
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
                            fill={index === chartData.length -1 ? 'url(#barGradient)' : '#F1F5F9'} 
                            style={{ 
                                filter: index === chartData.length -1 ? 'drop-shadow(0 10px 15px rgba(245, 158, 11, 0.3))' : 'none',
                                transition: 'all 0.3s ease'
                            }}
                            className="hover:fill-amber-200 transition-colors"
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
