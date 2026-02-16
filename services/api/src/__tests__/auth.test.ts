import express from 'express';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { authMiddleware } from '../middleware/auth';

const TEST_SECRET = 'test-secret';

// --- Mock pool ---
const mockQuery = jest.fn();
jest.mock('../db/pool', () => ({
  pool: { query: (...args: any[]) => mockQuery(...args) },
}));

jest.mock('../config', () => ({
  config: {
    jwtSecret: 'test-secret',
    port: 3000,
    databaseUrl: '',
    redisUrl: '',
    nodeEnv: 'test',
  },
}));

// Mock Redis so eventPublisher doesn't connect
jest.mock('ioredis', () => {
  return jest.fn().mockImplementation(() => ({
    publish: jest.fn(),
    quit: jest.fn(),
  }));
});

import authRoutes from '../routes/auth';

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use('/auth', authRoutes);
  // Protected test endpoint to verify middleware
  app.get('/protected', authMiddleware, (req: any, res) => {
    res.json({ userId: req.userId, userRole: req.userRole });
  });
  return app;
}

beforeEach(() => {
  mockQuery.mockReset();
});

// ============ Middleware Tests ============

describe('authMiddleware', () => {
  const app = buildApp();

  it('rejects missing authorization header', async () => {
    const res = await request(app).get('/protected');
    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/Missing/);
  });

  it('rejects bad format (no Bearer prefix)', async () => {
    const res = await request(app)
      .get('/protected')
      .set('Authorization', 'Basic abc');
    expect(res.status).toBe(401);
  });

  it('rejects invalid JWT', async () => {
    const res = await request(app)
      .get('/protected')
      .set('Authorization', 'Bearer invalid.token.here');
    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/Invalid token/);
  });

  it('accepts valid JWT and sets userId/userRole', async () => {
    const token = jwt.sign({ userId: 'u1', role: 'student' }, TEST_SECRET);
    const res = await request(app)
      .get('/protected')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.userId).toBe('u1');
    expect(res.body.userRole).toBe('student');
  });
});

// ============ Register Tests ============

describe('POST /auth/register', () => {
  const app = buildApp();

  it('returns 201 with user and token on success', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [{ id: 'u1', email: 'kid@test.com', display_name: 'Kid', role: 'student' }],
    });

    const res = await request(app).post('/auth/register').send({
      email: 'kid@test.com',
      password: 'pass123',
      displayName: 'Kid',
      role: 'student',
    });

    expect(res.status).toBe(201);
    expect(res.body.user.email).toBe('kid@test.com');
    expect(res.body.token).toBeDefined();
    // Verify token is valid
    const decoded = jwt.verify(res.body.token, TEST_SECRET) as any;
    expect(decoded.userId).toBe('u1');
  });

  it('returns 400 when required fields are missing', async () => {
    const res = await request(app).post('/auth/register').send({
      email: 'kid@test.com',
    });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/Missing required fields/);
  });

  it('returns 409 on duplicate email', async () => {
    mockQuery.mockRejectedValueOnce({ code: '23505' });

    const res = await request(app).post('/auth/register').send({
      email: 'dup@test.com',
      password: 'pass123',
      displayName: 'Dup',
      role: 'student',
    });
    expect(res.status).toBe(409);
    expect(res.body.error).toMatch(/already exists/);
  });
});

// ============ Login Tests ============

describe('POST /auth/login', () => {
  const app = buildApp();

  it('returns token on valid credentials', async () => {
    const hash = await bcrypt.hash('pass123', 10);
    mockQuery.mockResolvedValueOnce({
      rows: [{ id: 'u1', email: 'kid@test.com', display_name: 'Kid', role: 'student', password_hash: hash }],
    });

    const res = await request(app).post('/auth/login').send({
      email: 'kid@test.com',
      password: 'pass123',
    });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.email).toBe('kid@test.com');
  });

  it('returns 401 on wrong password', async () => {
    const hash = await bcrypt.hash('correct', 10);
    mockQuery.mockResolvedValueOnce({
      rows: [{ id: 'u1', email: 'kid@test.com', display_name: 'Kid', role: 'student', password_hash: hash }],
    });

    const res = await request(app).post('/auth/login').send({
      email: 'kid@test.com',
      password: 'wrong',
    });
    expect(res.status).toBe(401);
  });

  it('returns 401 for non-existent user', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });

    const res = await request(app).post('/auth/login').send({
      email: 'noone@test.com',
      password: 'pass123',
    });
    expect(res.status).toBe(401);
  });
});
