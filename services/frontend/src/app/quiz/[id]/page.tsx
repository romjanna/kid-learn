'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getQuiz, submitQuiz } from '@/lib/api';
import { getStoredAuth } from '@/lib/auth';

interface Question {
  id: string;
  question_text: string;
  options: string[];
  sort_order: number;
}

interface QuizResult {
  questionId: string;
  selectedAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  explanation: string;
}

export default function QuizPage() {
  const params = useParams();
  const router = useRouter();
  const [quiz, setQuiz] = useState<any>(null);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<string, { answer: string; startTime: number }>>({});
  const [results, setResults] = useState<{ correctCount: number; accuracyPct: number; results: QuizResult[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [startTime, setStartTime] = useState(Date.now());

  useEffect(() => {
    getQuiz(params.id as string)
      .then(data => { setQuiz(data); setStartTime(Date.now()); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [params.id]);

  const questions: Question[] = quiz?.questions || [];
  const question = questions[current];

  const selectAnswer = (answer: string) => {
    setAnswers({
      ...answers,
      [question.id]: { answer, startTime: Date.now() - startTime },
    });
  };

  const handleSubmit = async () => {
    const auth = getStoredAuth();
    if (!auth) {
      router.push('/login');
      return;
    }

    const formattedAnswers = questions.map(q => ({
      questionId: q.id,
      selectedAnswer: answers[q.id]?.answer || '',
      timeSpentMs: answers[q.id]?.startTime || 0,
    }));

    try {
      const result = await submitQuiz(params.id as string, formattedAnswers, auth.token);
      setResults(result);
    } catch (err: any) {
      console.error('Submit failed:', err);
    }
  };

  if (loading) return <div className="text-center py-12 text-gray-500">Loading quiz...</div>;
  if (!quiz) return <div className="text-center py-12 text-red-500">Quiz not found</div>;

  // Results view
  if (results) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-xl shadow-md p-8 text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Quiz Complete!</h1>
          <p className="text-6xl font-bold text-indigo-600 my-4">{results.accuracyPct}%</p>
          <p className="text-gray-600">
            You got {results.correctCount} out of {questions.length} correct
          </p>
        </div>

        <div className="space-y-4">
          {results.results.map((r, i) => (
            <div key={i} className={`bg-white rounded-xl shadow-sm p-6 border-l-4 ${r.isCorrect ? 'border-green-500' : 'border-red-500'}`}>
              <p className="font-medium mb-2">{questions[i]?.question_text}</p>
              <p className="text-sm">
                Your answer: <span className={r.isCorrect ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>{r.selectedAnswer}</span>
              </p>
              {!r.isCorrect && (
                <p className="text-sm text-green-600">Correct: {r.correctAnswer}</p>
              )}
              {r.explanation && <p className="text-sm text-gray-500 mt-2">{r.explanation}</p>}
            </div>
          ))}
        </div>

        <button onClick={() => router.push('/quiz')} className="mt-8 w-full bg-indigo-600 text-white py-3 rounded-lg font-medium hover:bg-indigo-700">
          Back to Quizzes
        </button>
      </div>
    );
  }

  // Quiz-taking view
  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">{quiz.title}</h1>
        <span className="text-sm text-gray-500">
          {current + 1} / {questions.length}
        </span>
      </div>

      <div className="w-full bg-gray-200 rounded-full h-2 mb-8">
        <div
          className="bg-indigo-600 h-2 rounded-full transition-all"
          style={{ width: `${((current + 1) / questions.length) * 100}%` }}
        />
      </div>

      <div className="bg-white rounded-xl shadow-md p-8">
        <h2 className="text-xl font-medium mb-6">{question?.question_text}</h2>

        <div className="space-y-3">
          {question?.options.map((option: string) => (
            <button
              key={option}
              onClick={() => selectAnswer(option)}
              className={`w-full text-left p-4 rounded-lg border-2 transition ${
                answers[question.id]?.answer === option
                  ? 'border-indigo-600 bg-indigo-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              {option}
            </button>
          ))}
        </div>

        <div className="flex justify-between mt-8">
          <button
            onClick={() => setCurrent(Math.max(0, current - 1))}
            disabled={current === 0}
            className="px-6 py-2 rounded-lg text-gray-600 hover:bg-gray-100 disabled:opacity-50"
          >
            Previous
          </button>

          {current < questions.length - 1 ? (
            <button
              onClick={() => setCurrent(current + 1)}
              disabled={!answers[question?.id]}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
            >
              Next
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={Object.keys(answers).length < questions.length}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              Submit Quiz
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
