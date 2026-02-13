import { Router, Request, Response } from 'express';
import { pool } from '../db/pool';
import { publishEvent } from '../services/eventPublisher';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

// List quizzes (public)
router.get('/', async (req: Request, res: Response) => {
  try {
    const { subject, difficulty, limit = '20' } = req.query;

    let query = `
      SELECT q.id, q.title, q.difficulty, q.source, q.created_at,
             s.name as subject_name, s.color as subject_color,
             (SELECT COUNT(*) FROM quiz_questions qq WHERE qq.quiz_id = q.id) as question_count
      FROM quizzes q
      JOIN subjects s ON s.id = q.subject_id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (subject) {
      params.push(subject);
      query += ` AND LOWER(s.name) = LOWER($${params.length})`;
    }
    if (difficulty) {
      params.push(difficulty);
      query += ` AND q.difficulty = $${params.length}`;
    }

    params.push(parseInt(limit as string));
    query += ` ORDER BY q.created_at DESC LIMIT $${params.length}`;

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error('List quizzes error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get quiz with questions
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const quizResult = await pool.query(
      `SELECT q.id, q.title, q.difficulty, q.source,
              s.name as subject_name, s.color as subject_color
       FROM quizzes q
       JOIN subjects s ON s.id = q.subject_id
       WHERE q.id = $1`,
      [id]
    );

    if (quizResult.rows.length === 0) {
      res.status(404).json({ error: 'Quiz not found' });
      return;
    }

    const questionsResult = await pool.query(
      `SELECT id, question_text, question_type, options, sort_order
       FROM quiz_questions
       WHERE quiz_id = $1
       ORDER BY sort_order`,
      [id]
    );

    res.json({
      ...quizResult.rows[0],
      questions: questionsResult.rows,
    });
  } catch (err) {
    console.error('Get quiz error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Submit quiz answers (authenticated)
router.post('/:id/submit', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { answers } = req.body;
    const userId = req.userId;

    if (!answers || !Array.isArray(answers)) {
      res.status(400).json({ error: 'Missing answers array' });
      return;
    }

    // Get correct answers
    const correctResult = await pool.query(
      'SELECT id, correct_answer, explanation FROM quiz_questions WHERE quiz_id = $1',
      [id]
    );

    const correctMap = new Map(
      correctResult.rows.map((r: any) => [r.id, { answer: r.correct_answer, explanation: r.explanation }])
    );

    let correct = 0;
    const results = [];

    for (const answer of answers) {
      const correctData = correctMap.get(answer.questionId);
      const isCorrect = correctData?.answer === answer.selectedAnswer;
      if (isCorrect) correct++;

      results.push({
        questionId: answer.questionId,
        selectedAnswer: answer.selectedAnswer,
        correctAnswer: correctData?.answer,
        isCorrect,
        explanation: correctData?.explanation,
      });

      // Publish event to Redis → Worker picks it up
      await publishEvent('learning-events', {
        event_type: 'quiz_answer',
        user_id: userId,
        payload: {
          quiz_id: id,
          question_id: answer.questionId,
          selected_answer: answer.selectedAnswer,
          is_correct: isCorrect,
          time_spent_ms: answer.timeSpentMs || null,
        },
      });
    }

    res.json({
      quizId: id,
      totalQuestions: answers.length,
      correctCount: correct,
      accuracyPct: Math.round((correct / answers.length) * 100),
      results,
    });
  } catch (err) {
    console.error('Submit quiz error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
