'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { graphqlQuery } from '@/lib/api';

interface Quiz {
  id: string;
  title: string;
  difficulty: string;
  subjectName: string;
  subjectColor: string;
  questionCount: string;
}

const DIFFICULTY_COLORS: Record<string, string> = {
  easy: 'bg-green-100 text-green-700',
  medium: 'bg-yellow-100 text-yellow-700',
  hard: 'bg-red-100 text-red-700',
};

export default function QuizListPage() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    graphqlQuery(`
      query ($subject: String) {
        quizzes(subject: $subject) {
          id
          title
          difficulty
          subjectName
          subjectColor
          questionCount
        }
      }
    `, filter ? { subject: filter } : undefined)
    .then(response => setQuizzes(response.data.quizzes))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [filter]);

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Quizzes</h1>
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
        <div className="text-center py-12 text-gray-500">Loading quizzes...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {quizzes.map(quiz => (
            <Link key={quiz.id} href={`/quiz/${quiz.id}`}>
              <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition cursor-pointer">
                <div className="flex items-center justify-between mb-3">
                  <span
                    className="text-sm font-medium px-3 py-1 rounded-full"
                    style={{ backgroundColor: quiz.subjectColor + '20', color: quiz.subjectColor }}
                  >
                    {quiz.subjectName}
                  </span>
                  <span className={`text-xs font-medium px-2 py-1 rounded ${DIFFICULTY_COLORS[quiz.difficulty]}`}>
                    {quiz.difficulty}
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{quiz.title}</h3>
                <p className="text-sm text-gray-500">{quiz.questionCount} questions</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
