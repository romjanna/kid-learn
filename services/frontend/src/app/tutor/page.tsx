'use client';

import { useEffect, useRef, useState } from 'react';
import { getStoredAuth } from '@/lib/auth';
import { getTutorSessions } from '@/lib/api';
import { useRouter } from 'next/navigation';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface Session {
  id: string;
  created_at: string;
  subject_name: string | null;
  first_message: string | null;
}

export default function TutorPage() {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [showSidebar, setShowSidebar] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const auth = getStoredAuth();

  useEffect(() => {
    if (!auth) {
      router.push('/login');
    }
  }, [auth, router]);

  useEffect(() => {
    if (auth?.token) {
      getTutorSessions(auth.token).then(setSessions).catch(console.error);
    }
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadSession = async (id: string) => {
    if (!auth) return;
    try {
      const res = await fetch(`${API_URL}/api/tutor/sessions/${id}`, {
        headers: { Authorization: `Bearer ${auth.token}` },
      });
      const msgs = await res.json();
      setMessages(msgs.map((m: any) => ({ role: m.role, content: m.content })));
      setSessionId(id);
      setShowSidebar(false);
    } catch (err) {
      console.error('Failed to load session:', err);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || loading || !auth) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/tutor/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${auth.token}`,
        },
        body: JSON.stringify({ message: userMessage, sessionId }),
      });

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) throw new Error('No response body');

      let assistantContent = '';
      setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = decoder.decode(value);
        const lines = text.split('\n').filter(l => l.startsWith('data: '));

        for (const line of lines) {
          try {
            const data = JSON.parse(line.slice(6));
            if (data.type === 'session') {
              setSessionId(data.sessionId);
            } else if (data.type === 'content') {
              assistantContent += data.content;
              setMessages(prev => {
                const updated = [...prev];
                updated[updated.length - 1] = { role: 'assistant', content: assistantContent };
                return updated;
              });
            } else if (data.type === 'error') {
              console.error('Stream error:', data.error);
            }
          } catch {
            // skip malformed lines
          }
        }
      }
    } catch (err) {
      console.error('Chat error:', err);
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, something went wrong. Please try again.' }]);
    } finally {
      setLoading(false);
    }
  };

  const startNewChat = () => {
    setMessages([]);
    setSessionId(null);
    setShowSidebar(false);
  };

  if (!auth) return null;

  return (
    <div className="flex h-[calc(100vh-64px)]">
      {/* Sidebar */}
      <div className={`${showSidebar ? 'block' : 'hidden'} md:block w-64 bg-gray-50 border-r overflow-y-auto flex-shrink-0`}>
        <div className="p-4">
          <button
            onClick={startNewChat}
            className="w-full bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 mb-4"
          >
            New Chat
          </button>
          <h3 className="text-sm font-semibold text-gray-500 mb-2">Previous Sessions</h3>
          {sessions.length === 0 ? (
            <p className="text-sm text-gray-400">No previous chats</p>
          ) : (
            sessions.map(s => (
              <button
                key={s.id}
                onClick={() => loadSession(s.id)}
                className={`w-full text-left p-2 rounded text-sm mb-1 hover:bg-gray-200 ${sessionId === s.id ? 'bg-gray-200' : ''}`}
              >
                <div className="truncate font-medium">{s.first_message || 'New chat'}</div>
                <div className="text-xs text-gray-400">
                  {s.subject_name && `${s.subject_name} · `}
                  {new Date(s.created_at).toLocaleDateString()}
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col">
        {/* Mobile sidebar toggle */}
        <div className="md:hidden p-2 border-b">
          <button onClick={() => setShowSidebar(!showSidebar)} className="text-sm text-indigo-600">
            {showSidebar ? 'Hide' : 'Show'} Sessions
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && (
            <div className="text-center text-gray-400 mt-20">
              <h2 className="text-2xl font-bold mb-2">AI Tutor</h2>
              <p>Ask me anything about Math, Science, History, English, or Geography!</p>
              <p className="text-sm mt-2">I'll explain things in a way that's easy to understand.</p>
            </div>
          )}
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                  msg.role === 'user'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                <div className="whitespace-pre-wrap">{msg.content}</div>
              </div>
            </div>
          ))}
          {loading && messages[messages.length - 1]?.content === '' && (
            <div className="flex justify-start">
              <div className="bg-gray-100 rounded-2xl px-4 py-2 text-gray-400">
                Thinking...
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="border-t p-4">
          <div className="flex gap-2 max-w-3xl mx-auto">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
              placeholder="Ask your tutor a question..."
              className="flex-1 border rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              disabled={loading}
            />
            <button
              onClick={sendMessage}
              disabled={loading || !input.trim()}
              className="bg-indigo-600 text-white px-6 py-2 rounded-xl hover:bg-indigo-700 disabled:opacity-50"
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
