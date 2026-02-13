import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '../db/pool';
import { config } from '../config';

const router = Router();

router.post('/register', async (req: Request, res: Response) => {
  try {
    const { email, password, displayName, role, age, gradeLevel, parentId } = req.body;

    if (!email || !password || !displayName || !role) {
      res.status(400).json({ error: 'Missing required fields: email, password, displayName, role' });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `INSERT INTO users (email, display_name, role, age, grade_level, parent_id, password_hash)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, email, display_name, role`,
      [email, displayName, role, age || null, gradeLevel || null, parentId || null, passwordHash]
    );

    const user = result.rows[0];
    const token = jwt.sign({ userId: user.id, role: user.role }, config.jwtSecret, { expiresIn: '7d' });

    res.status(201).json({ user, token });
  } catch (err: any) {
    if (err.code === '23505') {
      res.status(409).json({ error: 'Email already exists' });
      return;
    }
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Missing email or password' });
      return;
    }

    const result = await pool.query(
      'SELECT id, email, display_name, role, password_hash FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);

    if (!valid) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    const token = jwt.sign({ userId: user.id, role: user.role }, config.jwtSecret, { expiresIn: '7d' });

    res.json({
      user: { id: user.id, email: user.email, display_name: user.display_name, role: user.role },
      token,
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
