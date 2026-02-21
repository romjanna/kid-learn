'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { login, register } from '@/lib/api';
import { setStoredAuth } from '@/lib/auth';

export default function LoginPage() {
  const router = useRouter();
  const [isRegister, setIsRegister] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    email: '', password: '', displayName: '', role: 'student', age: '', gradeLevel: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      let result;
      if (isRegister) {
        result = await register({
          email: form.email,
          password: form.password,
          displayName: form.displayName,
          role: form.role,
          age: form.age ? parseInt(form.age) : undefined,
          gradeLevel: form.gradeLevel ? parseInt(form.gradeLevel) : undefined,
        });
      } else {
        result = await login(form.email, form.password);
      }
      setStoredAuth(result.user, result.token);
      window.dispatchEvent(new Event('storage'));
      router.push('/quiz');
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-12">
      <div className="bg-white rounded-xl shadow-md p-8">
        <h1 className="text-2xl font-bold text-center mb-6">
          {isRegister ? 'Create Account' : 'Welcome Back'}
        </h1>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded mb-4 text-sm">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <>
              <input
                type="text"
                placeholder="Display Name"
                value={form.displayName}
                onChange={e => setForm({ ...form, displayName: e.target.value })}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                required
              />
              <div className="grid grid-cols-2 gap-3">
                <select
                  value={form.role}
                  onChange={e => setForm({ ...form, role: e.target.value })}
                  className="p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  <option value="student">Student</option>
                  <option value="parent">Parent</option>
                  <option value="teacher">Teacher</option>
                </select>
                <input
                  type="number"
                  placeholder="Grade Level"
                  value={form.gradeLevel}
                  onChange={e => setForm({ ...form, gradeLevel: e.target.value })}
                  className="p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  min="1" max="12"
                />
              </div>
            </>
          )}

          <input
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={e => setForm({ ...form, email: e.target.value })}
            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={e => setForm({ ...form, password: e.target.value })}
            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            required
          />

          <button type="submit" className="w-full bg-indigo-600 text-white py-3 rounded-lg font-medium hover:bg-indigo-700 transition">
            {isRegister ? 'Sign Up' : 'Log In'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-4">
          {isRegister ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button onClick={() => setIsRegister(!isRegister)} className="text-indigo-600 font-medium hover:underline">
            {isRegister ? 'Log In' : 'Sign Up'}
          </button>
        </p>
      </div>
    </div>
  );
}
