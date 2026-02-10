"use client";

import { Line, LineChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

const data = [
  { month: "Feb", current: 2000, previous: 1500 },
  { month: "Mar", current: 2500, previous: 2200 },
  { month: "Apr", current: 2200, previous: 1800 },
  { month: "May", current: 3500, previous: 2500 },
  { month: "Jun", current: 3000, previous: 2800 },
  { month: "Jul", current: 4200, previous: 3200 },
  { month: "Aug", current: 3800, previous: 3500 },
  { month: "Oct", current: 4500, previous: 3800 },
  { month: "Dec", current: 5200, previous: 4200 },
];

export function ReturningRateChart() {
  return (
    <Card className="col-span-1 border-none shadow-xl shadow-gray-200/50 bg-white/50 backdrop-blur-sm">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-lg font-black tracking-tight">Returning Rate</CardTitle>
          <p className="text-sm text-muted-foreground font-medium">Income in the last 28 days</p>
        </div>
        <div className="flex items-center gap-2">
            <h2 className="text-2xl font-black mr-2">₹42,379</h2>
            <span className="bg-emerald-100 text-emerald-600 px-2 py-0.5 rounded-full text-xs font-black">+2.5%</span>
            <Button variant="ghost" size="icon" className="ml-2">
                <Download className="h-4 w-4 text-muted-foreground" />
            </Button>
        </div>
      </CardHeader>
      <CardContent className="px-2 pb-6">
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
            <XAxis
              dataKey="month"
              stroke="#888888"
              fontSize={12}
              fontWeight={600}
              tickLine={false}
              axisLine={false}
              dy={10}
            />
            <YAxis
              stroke="#888888"
              fontSize={12}
              fontWeight={600}
              tickLine={false}
              axisLine={false}
              hide
            />
            <Tooltip 
              contentStyle={{ border: 'none', borderRadius: '16px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.15)', padding: '12px' }}
              itemStyle={{ fontWeight: '800' }}
              labelStyle={{ color: '#64748b', fontWeight: '700', marginBottom: '4px' }}
              cursor={{ stroke: 'rgba(249, 115, 22, 0.2)', strokeWidth: 2 }}
            />
            <Line
              type="monotone"
              dataKey="current"
              stroke="#F97316"
              strokeWidth={4}
              dot={false}
              activeDot={{ r: 8, strokeWidth: 0, fill: '#F97316' }}
            />
            <Line
              type="monotone"
              dataKey="previous"
              stroke="#CBD5E1"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={false}
              activeDot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
