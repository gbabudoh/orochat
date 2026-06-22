'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface Props {
  data: { period: string; oroPool: number; platformCut: number }[];
}

export default function RevenueChart({ data }: Props) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <p className="text-sm font-semibold text-[#333333] mb-4">Revenue by Month</p>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#F0F3F7" />
          <XAxis dataKey="period" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
          <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} formatter={(value) => `$${Number(value).toFixed(2)}`} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Bar dataKey="oroPool" name="Oro Pool" stackId="revenue" fill="#458B9E" radius={[0, 0, 0, 0]} />
          <Bar dataKey="platformCut" name="Platform Cut" stackId="revenue" fill="#FFC93C" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
