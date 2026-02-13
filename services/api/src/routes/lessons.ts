import { Router, Request, Response } from 'express';
import { pool } from '../db/pool';

const router = Router();

// List lessons
router.get('/', async (req: Request, res: Response) => {
  try {
    const { subject, difficulty, gradeLevel, limit = '20' } = req.query;

    let query = `
      SELECT l.id, l.title, l.difficulty, l.grade_min, l.grade_max, l.source, l.created_at,
             s.name as subject_name, s.color as subject_color
      FROM lessons l
      JOIN subjects s ON s.id = l.subject_id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (subject) {
      params.push(subject);
      query += ` AND LOWER(s.name) = LOWER($${params.length})`;
    }
    if (difficulty) {
      params.push(difficulty);
      query += ` AND l.difficulty = $${params.length}`;
    }
    if (gradeLevel) {
      params.push(parseInt(gradeLevel as string));
      query += ` AND l.grade_min <= $${params.length} AND l.grade_max >= $${params.length}`;
    }

    params.push(parseInt(limit as string));
    query += ` ORDER BY l.created_at DESC LIMIT $${params.length}`;

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error('List lessons error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get lesson by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT l.id, l.title, l.content, l.difficulty, l.grade_min, l.grade_max,
              l.metadata, l.source, l.created_at,
              s.name as subject_name, s.color as subject_color
       FROM lessons l
       JOIN subjects s ON s.id = l.subject_id
       WHERE l.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Lesson not found' });
      return;
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Get lesson error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
