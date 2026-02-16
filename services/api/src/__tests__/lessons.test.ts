import express from 'express';
import request from 'supertest';

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

jest.mock('ioredis', () => {
  return jest.fn().mockImplementation(() => ({
    publish: jest.fn(),
    quit: jest.fn(),
  }));
});

import lessonRoutes from '../routes/lessons';

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use('/lessons', lessonRoutes);
  return app;
}

beforeEach(() => {
  mockQuery.mockReset();
});

describe('GET /lessons', () => {
  const app = buildApp();

  it('returns a list of lessons', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [
        { id: 1, title: 'Intro to Fractions', difficulty: 'easy', subject_name: 'Math' },
        { id: 2, title: 'The Solar System', difficulty: 'medium', subject_name: 'Science' },
      ],
    });

    const res = await request(app).get('/lessons');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
    expect(res.body[0].title).toBe('Intro to Fractions');
  });

  it('passes subject filter to query', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });

    await request(app).get('/lessons?subject=Math');
    // Verify the query was called with Math in params
    const queryArgs = mockQuery.mock.calls[0];
    expect(queryArgs[1]).toContain('Math');
  });
});

describe('GET /lessons/:id', () => {
  const app = buildApp();

  it('returns a lesson by id', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [{
        id: 1,
        title: 'Intro to Fractions',
        content: 'Fractions are parts of a whole...',
        difficulty: 'easy',
        subject_name: 'Math',
      }],
    });

    const res = await request(app).get('/lessons/1');
    expect(res.status).toBe(200);
    expect(res.body.title).toBe('Intro to Fractions');
    expect(res.body.content).toBeDefined();
  });

  it('returns 404 for missing lesson', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });

    const res = await request(app).get('/lessons/999');
    expect(res.status).toBe(404);
    expect(res.body.error).toMatch(/not found/);
  });
});
