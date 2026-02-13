'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface EngagementDay {
  event_date?: string;
  eventDate?: string;
  total_events?: number;
  totalEvents?: number;
  quiz_answers?: number;
  quizAnswers?: number;
}

export default function EngagementTrend({ data }: { data: EngagementDay[] }) {
  if (data.length === 0) {
    return <p className="text-gray-400 text-center py-8">No activity data yet.</p>;
  }

  const chartData = data.map(d => ({
    date: (d.eventDate || d.event_date || '').slice(0, 10),
    events: d.totalEvents || d.total_events || 0,
    quizzes: d.quizAnswers || d.quiz_answers || 0,
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis />
        <Tooltip />
        <Line type="monotone" dataKey="events" stroke="#4F46E5" name="Total Events" />
        <Line type="monotone" dataKey="quizzes" stroke="#059669" name="Quiz Answers" />
      </LineChart>
    </ResponsiveContainer>
  );
}
