'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { getLesson } from '@/lib/api';

interface Lesson {
  id: string;
  title: string;
  content: string;
  difficulty: string;
  grade_min: number;
  grade_max: number;
  subject_name: string;
  subject_color: string;
}

export default function LessonDetailPage() {
  const params = useParams();
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getLesson(params.id as string)
      .then(setLesson)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [params.id]);

  if (loading) return <div className="text-center py-12 text-gray-500">Loading lesson...</div>;
  if (!lesson) return <div className="text-center py-12 text-red-500">Lesson not found</div>;

  return (
    <div className="max-w-3xl mx-auto">
      <Link href="/lessons" className="text-indigo-600 hover:underline text-sm mb-4 inline-block">
        &larr; Back to Lessons
      </Link>

      <div className="bg-white rounded-xl shadow-md p-8">
        <div className="flex items-center gap-3 mb-4">
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

        <h1 className="text-3xl font-bold text-gray-900 mb-6">{lesson.title}</h1>

        <div className="prose prose-indigo max-w-none whitespace-pre-wrap text-gray-700 leading-relaxed">
          {lesson.content}
        </div>
      </div>
    </div>
  );
}
