import { Router, Request, Response } from 'express';
import { pool } from '../db/pool';

const router = Router();

// Get student progress (reads from DBT mart tables)
router.get('/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const result = await pool.query(
      `SELECT subject_name, total_questions, correct_count, accuracy_pct, avg_time_ms, last_activity
       FROM mart_student_progress
       WHERE user_id = $1
       ORDER BY subject_name`,
      [userId]
    );

    const totals = result.rows.reduce(
      (acc, row) => ({
        totalQuestions: acc.totalQuestions + parseInt(row.total_questions),
        correctCount: acc.correctCount + parseInt(row.correct_count),
      }),
      { totalQuestions: 0, correctCount: 0 }
    );

    res.json({
      userId,
      overallAccuracy: totals.totalQuestions > 0
        ? Math.round((totals.correctCount / totals.totalQuestions) * 100)
        : 0,
      totalQuestions: totals.totalQuestions,
      correctCount: totals.correctCount,
      subjects: result.rows,
    });
  } catch (err: any) {
    // mart tables may not exist yet if dbt hasn't run
    if (err.code === '42P01') {
      res.json({ userId: req.params.userId, overallAccuracy: 0, totalQuestions: 0, correctCount: 0, subjects: [] });
      return;
    }
    console.error('Get progress error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get weak areas
router.get('/:userId/weak-areas', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const result = await pool.query(
      `SELECT subject_name, total_questions, correct_count, accuracy_pct, avg_time_ms
       FROM mart_weak_areas
       WHERE user_id = $1
       ORDER BY accuracy_pct ASC`,
      [userId]
    );

    res.json(result.rows);
  } catch (err: any) {
    if (err.code === '42P01') {
      res.json([]);
      return;
    }
    console.error('Get weak areas error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get engagement trends
router.get('/:userId/engagement', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { days = '30' } = req.query;

    const result = await pool.query(
      `SELECT event_date, total_events, sessions_count, quiz_answers, lessons_viewed, hints_requested
       FROM mart_engagement_trends
       WHERE user_id = $1 AND event_date >= NOW() - INTERVAL '1 day' * $2
       ORDER BY event_date ASC`,
      [userId, parseInt(days as string)]
    );

    res.json(result.rows);
  } catch (err: any) {
    if (err.code === '42P01') {
      res.json([]);
      return;
    }
    console.error('Get engagement error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
