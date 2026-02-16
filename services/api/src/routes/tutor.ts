import { Router, Request, Response } from 'express';
import { pool } from '../db/pool';
import { createTutorStream, buildTutorSystemPrompt } from '../services/aiService';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

// Chat with AI tutor (streaming SSE)
router.post('/chat', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { message, sessionId, subjectId } = req.body;
    const userId = req.userId;

    if (!message) {
      res.status(400).json({ error: 'Missing message' });
      return;
    }

    // Get or create session
    let currentSessionId = sessionId;
    if (!currentSessionId) {
      const sessionResult = await pool.query(
        'INSERT INTO tutor_sessions (user_id, subject_id) VALUES ($1, $2) RETURNING id',
        [userId, subjectId || null]
      );
      currentSessionId = sessionResult.rows[0].id;
    }

    // Store user message
    await pool.query(
      'INSERT INTO tutor_messages (session_id, role, content) VALUES ($1, $2, $3)',
      [currentSessionId, 'user', message]
    );

    // Get conversation history
    const historyResult = await pool.query(
      'SELECT role, content FROM tutor_messages WHERE session_id = $1 ORDER BY created_at ASC LIMIT 20',
      [currentSessionId]
    );

    // Get subject name if available
    let subjectName: string | undefined;
    if (subjectId) {
      const subjectResult = await pool.query('SELECT name FROM subjects WHERE id = $1', [subjectId]);
      subjectName = subjectResult.rows[0]?.name;
    }

    // Build messages for OpenAI
    const messages: { role: 'system' | 'user' | 'assistant'; content: string }[] = [
      { role: 'system', content: buildTutorSystemPrompt(subjectName) },
      ...historyResult.rows.map((r: any) => ({ role: r.role, content: r.content })),
    ];

    // Set up SSE streaming
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // Send session ID first
    res.write(`data: ${JSON.stringify({ type: 'session', sessionId: currentSessionId })}\n\n`);

    // Stream the response
    const stream = await createTutorStream(messages);
    let fullResponse = '';

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || '';
      if (content) {
        fullResponse += content;
        res.write(`data: ${JSON.stringify({ type: 'content', content })}\n\n`);
      }
    }

    // Store assistant response
    await pool.query(
      'INSERT INTO tutor_messages (session_id, role, content) VALUES ($1, $2, $3)',
      [currentSessionId, 'assistant', fullResponse]
    );

    res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`);
    res.end();
  } catch (err) {
    console.error('Tutor chat error:', err);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Tutor chat failed' });
    } else {
      res.write(`data: ${JSON.stringify({ type: 'error', error: 'Chat failed' })}\n\n`);
      res.end();
    }
  }
});

// List tutor sessions
router.get('/sessions', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT ts.id, ts.created_at, s.name as subject_name,
              (SELECT content FROM tutor_messages tm WHERE tm.session_id = ts.id ORDER BY created_at ASC LIMIT 1) as first_message
       FROM tutor_sessions ts
       LEFT JOIN subjects s ON s.id = ts.subject_id
       WHERE ts.user_id = $1
       ORDER BY ts.created_at DESC`,
      [req.userId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('List sessions error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get session messages
router.get('/sessions/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query(
      'SELECT role, content, created_at FROM tutor_messages WHERE session_id = $1 ORDER BY created_at ASC',
      [req.params.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Get session error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
