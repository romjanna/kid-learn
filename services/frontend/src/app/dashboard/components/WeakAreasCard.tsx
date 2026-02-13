'use client';

interface WeakArea {
  subject_name?: string;
  subjectName?: string;
  accuracy_pct?: number;
  accuracyPct?: number;
  total_questions?: number;
  totalQuestions?: number;
}

export default function WeakAreasCard({ data }: { data: WeakArea[] }) {
  if (data.length === 0) {
    return <p className="text-gray-400 text-center py-4">No weak areas detected. Keep it up!</p>;
  }

  return (
    <div className="space-y-3">
      {data.map((area, i) => {
        const name = area.subjectName || area.subject_name || '';
        const pct = area.accuracyPct || area.accuracy_pct || 0;
        const total = area.totalQuestions || area.total_questions || 0;

        return (
          <div key={i} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
            <div>
              <p className="font-medium text-gray-900">{name}</p>
              <p className="text-sm text-gray-500">{total} questions attempted</p>
            </div>
            <span className="text-red-600 font-bold">{pct}%</span>
          </div>
        );
      })}
    </div>
  );
}
