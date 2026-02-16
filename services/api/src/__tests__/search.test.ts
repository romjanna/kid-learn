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

const mockGenerateEmbedding = jest.fn();
jest.mock('../services/aiService', () => ({
  generateEmbedding: (...args: any[]) => mockGenerateEmbedding(...args),
}));

jest.mock('ioredis', () => {
  return jest.fn().mockImplementation(() => ({
    publish: jest.fn(),
    quit: jest.fn(),
  }));
});

import searchRoutes from '../routes/search';

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use('/search', searchRoutes);
  return app;
}

beforeEach(() => {
  mockQuery.mockReset();
  mockGenerateEmbedding.mockReset();
});

describe('POST /search', () => {
  const app = buildApp();

  it('generates embedding, queries pgvector, merges and sorts results', async () => {
    mockGenerateEmbedding.mockResolvedValueOnce([0.1, 0.2, 0.3]);

    mockQuery
      // Lessons result
      .mockResolvedValueOnce({
        rows: [{ id: 1, title: 'Fractions Lesson', content: 'About fractions...', difficulty: 'easy', similarity: 0.9 }],
      })
      // Questions result
      .mockResolvedValueOnce({
        rows: [{ id: 2, title: 'What is 1/2?', content: 'Half', difficulty: 'easy', similarity: 0.85 }],
      });

    const res = await request(app)
      .post('/search')
      .send({ query: 'fractions', limit: 10 });

    expect(res.status).toBe(200);
    expect(mockGenerateEmbedding).toHaveBeenCalledWith('fractions');
    expect(res.body).toHaveLength(2);
    // Should be sorted by similarity descending
    expect(res.body[0].similarity).toBeGreaterThanOrEqual(res.body[1].similarity);
    expect(res.body[0].type).toBe('lesson');
    expect(res.body[1].type).toBe('question');
  });

  it('returns 400 for missing query', async () => {
    const res = await request(app)
      .post('/search')
      .send({});
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/Missing query/);
  });
});
