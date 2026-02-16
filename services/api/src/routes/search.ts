import { Router, Request, Response } from 'express';
import { pool } from '../db/pool';
import { generateEmbedding } from '../services/aiService';

const router = Router();

router.post('/', async (req: Request, res: Response) => {
  try {
    const { query, limit = 10 } = req.body;

    if (!query) {
      res.status(400).json({ error: 'Missing query' });
      return;
    }

    // Generate embedding for the search query
    const embedding = await generateEmbedding(query);
    const embeddingStr = `[${embedding.join(',')}]`;

    // Search lessons by cosine similarity
    const lessonsResult = await pool.query(
      `SELECT id, title, content, difficulty,
              1 - (embedding <=> $1::vector) as similarity
       FROM lessons
       WHERE embedding IS NOT NULL
       ORDER BY embedding <=> $1::vector
       LIMIT $2`,
      [embeddingStr, Math.ceil(limit / 2)]
    );

    // Search questions by cosine similarity
    const questionsResult = await pool.query(
      `SELECT qq.id, qq.question_text as title, qq.explanation as content,
              q.difficulty,
              1 - (qq.embedding <=> $1::vector) as similarity
       FROM quiz_questions qq
       JOIN quizzes q ON q.id = qq.quiz_id
       WHERE qq.embedding IS NOT NULL
       ORDER BY qq.embedding <=> $1::vector
       LIMIT $2`,
      [embeddingStr, Math.ceil(limit / 2)]
    );

    const results = [
      ...lessonsResult.rows.map(r => ({ ...r, type: 'lesson', snippet: r.content?.slice(0, 200) })),
      ...questionsResult.rows.map(r => ({ ...r, type: 'question', snippet: r.content?.slice(0, 200) })),
    ].sort((a, b) => b.similarity - a.similarity).slice(0, limit);

    res.json(results);
  } catch (err) {
    console.error('Search error:', err);
    res.status(500).json({ error: 'Search failed' });
  }
});

export default router;
