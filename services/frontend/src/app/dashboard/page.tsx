'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getProgress, getWeakAreas, getEngagement } from '@/lib/api';
import { getStoredAuth } from '@/lib/auth';
import ProgressChart from './components/ProgressChart';
import WeakAreasCard from './components/WeakAreasCard';
import EngagementTrend from './components/EngagementTrend';

export default function DashboardPage() {
  const router = useRouter();
  const [progress, setProgress] = useState<any>(null);
  const [weakAreas, setWeakAreas] = useState<any[]>([]);
  const [engagement, setEngagement] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const auth = getStoredAuth();
    if (!auth) {
      router.push('/login');
      return;
    }

    Promise.all([
      getProgress(auth.user.id),
      getWeakAreas(auth.user.id),
      getEngagement(auth.user.id),
    ])
      .then(([prog, weak, eng]) => {
        setProgress(prog);
        setWeakAreas(weak);
        setEngagement(eng);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [router]);

  if (loading) return <div className="text-center py-12 text-gray-500">Loading dashboard...</div>;

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Dashboard</h1>

      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-md p-6">
          <p className="text-sm text-gray-500 mb-1">Overall Accuracy</p>
          <p className="text-4xl font-bold text-indigo-600">{progress?.overallAccuracy || 0}%</p>
        </div>
        <div className="bg-white rounded-xl shadow-md p-6">
          <p className="text-sm text-gray-500 mb-1">Questions Answered</p>
          <p className="text-4xl font-bold text-gray-900">{progress?.totalQuestions || 0}</p>
        </div>
        <div className="bg-white rounded-xl shadow-md p-6">
          <p className="text-sm text-gray-500 mb-1">Correct Answers</p>
          <p className="text-4xl font-bold text-green-600">{progress?.correctCount || 0}</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-lg font-semibold mb-4">Progress by Subject</h2>
          <ProgressChart data={progress?.subjects || []} />
        </div>
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-lg font-semibold mb-4">Activity Trend</h2>
          <EngagementTrend data={engagement} />
        </div>
      </div>

      {/* Weak areas */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-lg font-semibold mb-4">Areas to Improve</h2>
        <WeakAreasCard data={weakAreas} />
      </div>
    </div>
  );
}
