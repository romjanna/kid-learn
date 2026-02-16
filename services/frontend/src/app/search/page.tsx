'use client';

import { useState } from 'react';
import Link from 'next/link';
import { semanticSearch } from '@/lib/api';

interface SearchResult {
  id: string;
  title: string;
  type: 'lesson' | 'question';
  difficulty: string;
  similarity: number;
  snippet: string;
}

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      const data = await semanticSearch(query.trim());
      setResults(data);
    } catch (err) {
      console.error('Search failed:', err);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-2">Semantic Search</h1>
      <p className="text-gray-500 mb-6">Search lessons and quiz questions using AI-powered semantic similarity</p>

      <div className="flex gap-2 mb-8">
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSearch()}
          placeholder='Try "how do plants make food" or "ancient civilizations"...'
          className="flex-1 border rounded-lg px-4 py-3 text-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <button
          onClick={handleSearch}
          disabled={loading || !query.trim()}
          className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 disabled:opacity-50 text-lg"
        >
          {loading ? 'Searching...' : 'Search'}
        </button>
      </div>

      {searched && !loading && results.length === 0 && (
        <p className="text-center text-gray-400 py-8">No results found. Try a different query or make sure embeddings have been generated.</p>
      )}

      <div className="space-y-4">
        {results.map(result => (
          <div key={`${result.type}-${result.id}`} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2 mb-2">
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                result.type === 'lesson' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
              }`}>
                {result.type === 'lesson' ? 'Lesson' : 'Question'}
              </span>
              <span className="text-xs text-gray-400">
                {(result.similarity * 100).toFixed(1)}% match
              </span>
              {result.difficulty && (
                <span className="text-xs text-gray-400 capitalize">{result.difficulty}</span>
              )}
            </div>
            <h3 className="font-semibold text-lg mb-1">
              {result.type === 'lesson' ? (
                <Link href={`/lessons/${result.id}`} className="text-indigo-600 hover:underline">
                  {result.title}
                </Link>
              ) : (
                result.title
              )}
            </h3>
            {result.snippet && (
              <p className="text-gray-500 text-sm">{result.snippet}...</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
