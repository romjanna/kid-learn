const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface FetchOptions extends RequestInit {
  token?: string;
}

async function fetchApi(path: string, options: FetchOptions = {}) {
  const { token, ...init } = options;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${path}`, { ...init, headers });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(error.error || 'Request failed');
  }

  return res.json();
}

// Auth
export const login = (email: string, password: string) =>
  fetchApi('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });

export const register = (data: { email: string; password: string; displayName: string; role: string; age?: number; gradeLevel?: number }) =>
  fetchApi('/api/auth/register', { method: 'POST', body: JSON.stringify(data) });

// Quizzes
export const getQuizzes = (params?: { subject?: string; difficulty?: string }) => {
  const query = new URLSearchParams(params as Record<string, string>).toString();
  return fetchApi(`/api/quizzes${query ? `?${query}` : ''}`);
};

export const getQuiz = (id: string) => fetchApi(`/api/quizzes/${id}`);

export const submitQuiz = (quizId: string, answers: any[], token: string) =>
  fetchApi(`/api/quizzes/${quizId}/submit`, {
    method: 'POST',
    body: JSON.stringify({ answers }),
    token,
  });

// Lessons
export const getLessons = (params?: { subject?: string; difficulty?: string }) => {
  const query = new URLSearchParams(params as Record<string, string>).toString();
  return fetchApi(`/api/lessons${query ? `?${query}` : ''}`);
};

export const getLesson = (id: string) => fetchApi(`/api/lessons/${id}`);

// Progress
export const getProgress = (userId: string) => fetchApi(`/api/progress/${userId}`);
export const getWeakAreas = (userId: string) => fetchApi(`/api/progress/${userId}/weak-areas`);
export const getEngagement = (userId: string) => fetchApi(`/api/progress/${userId}/engagement`);

// Search
export const semanticSearch = (query: string, limit?: number) =>
  fetchApi('/api/search', { method: 'POST', body: JSON.stringify({ query, limit }) });

// Tutor
export const getTutorSessions = (token: string) =>
  fetchApi('/api/tutor/sessions', { token });

export const getTutorSession = (id: string, token: string) =>
  fetchApi(`/api/tutor/sessions/${id}`, { token });

// GraphQL
export const graphqlQuery = (query: string, variables?: Record<string, any>) =>
  fetchApi('/graphql', {
    method: 'POST',
    body: JSON.stringify({ query, variables }),
  });
