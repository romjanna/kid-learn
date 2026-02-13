'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getLessons } from '@/lib/api';

interface Lesson {
  id: string;
  title: string;
  difficulty: string;
  grade_min: number;
  grade_max: number;
  subject_name: string;
  subject_color: string;
}

export default function LessonsPage() {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getLessons(filter ? { subject: filter } : undefined)
      .then(setLessons)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [filter]);

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Lessons</h1>
        <div className="flex gap-2">
          {['', 'Math', 'Science', 'History', 'English', 'Geography'].map(s => (
            <button
              key={s}
              onClick={() => { setLoading(true); setFilter(s); }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                filter === s ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              {s || 'All'}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading lessons...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {lessons.map(lesson => (
            <Link key={lesson.id} href={`/lessons/${lesson.id}`}>
              <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition cursor-pointer">
                <div className="flex items-center gap-3 mb-3">
                  <span
                    className="text-sm font-medium px-3 py-1 rounded-full"
                    style={{ backgroundColor: lesson.subject_color + '20', color: lesson.subject_color }}
                  >
                    {lesson.subject_name}
                  </span>
                  <span className="text-xs text-gray-400">
                    Grades {lesson.grade_min}-{lesson.grade_max}
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900">{lesson.title}</h3>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
