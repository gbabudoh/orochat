'use client';

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface Props {
  data: { date: string; count: number }[];
}

export default function UsersGrowthChart({ data }: Props) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <p className="text-sm font-semibold text-[#333333] mb-4">New Users — Last 30 Days</p>
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="usersGrowthFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#458B9E" stopOpacity={0.35} />
              <stop offset="95%" stopColor="#458B9E" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#F0F3F7" />
          <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} allowDecimals={false} />
          <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
          <Area type="monotone" dataKey="count" stroke="#458B9E" strokeWidth={2} fill="url(#usersGrowthFill)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
