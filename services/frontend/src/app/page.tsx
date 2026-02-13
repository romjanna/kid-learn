import Link from 'next/link';

export default function Home() {
  return (
    <div className="text-center py-16">
      <h1 className="text-5xl font-bold text-gray-900 mb-4">
        Learn, Play, Grow
      </h1>
      <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto">
        Interactive quizzes, engaging lessons, and an AI tutor to help kids learn at their own pace.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
        <Link href="/quiz" className="bg-white rounded-xl shadow-md p-8 hover:shadow-lg transition group">
          <div className="text-4xl mb-4">&#x1F4DD;</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-indigo-600">Quizzes</h2>
          <p className="text-gray-500">Test your knowledge with fun quizzes across different subjects</p>
        </Link>

        <Link href="/lessons" className="bg-white rounded-xl shadow-md p-8 hover:shadow-lg transition group">
          <div className="text-4xl mb-4">&#x1F4DA;</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-indigo-600">Lessons</h2>
          <p className="text-gray-500">Explore lessons in Math, Science, History, and more</p>
        </Link>

        <Link href="/dashboard" className="bg-white rounded-xl shadow-md p-8 hover:shadow-lg transition group">
          <div className="text-4xl mb-4">&#x1F4CA;</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-indigo-600">Dashboard</h2>
          <p className="text-gray-500">Track progress, see weak areas, and get recommendations</p>
        </Link>
      </div>
    </div>
  );
}
