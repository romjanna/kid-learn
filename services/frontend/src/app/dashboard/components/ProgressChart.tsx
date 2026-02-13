'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface SubjectProgress {
  subjectName: string;
  totalQuestions: number;
  correctCount: number;
  accuracyPct: number;
}

export default function ProgressChart({ data }: { data: SubjectProgress[] }) {
  if (data.length === 0) {
    return <p className="text-gray-400 text-center py-8">No quiz data yet. Take a quiz to see your progress!</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="subjectName" />
        <YAxis domain={[0, 100]} unit="%" />
        <Tooltip formatter={(value: number) => `${value}%`} />
        <Bar dataKey="accuracyPct" fill="#4F46E5" radius={[4, 4, 0, 0]} name="Accuracy" />
      </BarChart>
    </ResponsiveContainer>
  );
}
