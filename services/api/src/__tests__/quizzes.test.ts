import express from 'express';
import request from 'supertest';
import jwt from 'jsonwebtoken';

const TEST_SECRET = 'test-secret';

const mockQuery = jest.fn();
jest.mock('../db/pool', () => ({
  pool: { query: (...args: any[]) => mockQuery(...args) },
}));

jest.mock('../config', () => ({
  config: {
    jwtSecret: TEST_SECRET,
    port: 3000,
    databaseUrl: '',
    redisUrl: '',
    nodeEnv: 'test',
  },
}));

const mockPublishEvent = jest.fn().mockResolvedValue(undefined);
jest.mock('../services/eventPublisher', () => ({
  publishEvent: (...args: any[]) => mockPublishEvent(...args),
  closeRedis: jest.fn(),
}));

jest.mock('ioredis', () => {
  return jest.fn().mockImplementation(() => ({
    publish: jest.fn(),
    quit: jest.fn(),
  }));
});

import quizRoutes from '../routes/quizzes';

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use('/quizzes', quizRoutes);
  return app;
}

beforeEach(() => {
  mockQuery.mockReset();
  mockPublishEvent.mockClear();
});

describe('GET /quizzes', () => {
  const app = buildApp();

  it('returns a list of quizzes', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [
        { id: 1, title: 'Math Quiz', difficulty: 'easy', subject_name: 'Math', question_count: '5' },
        { id: 2, title: 'Science Quiz', difficulty: 'medium', subject_name: 'Science', question_count: '3' },
      ],
    });

    const res = await request(app).get('/quizzes');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
    expect(res.body[0].title).toBe('Math Quiz');
  });
});

describe('GET /quizzes/:id', () => {
  const app = buildApp();

  it('returns quiz with questions', async () => {
    mockQuery
      .mockResolvedValueOnce({
        rows: [{ id: 1, title: 'Math Quiz', difficulty: 'easy', subject_name: 'Math' }],
      })
      .mockResolvedValueOnce({
        rows: [
          { id: 'q1', question_text: 'What is 2+2?', question_type: 'multiple_choice', options: ['3', '4'], sort_order: 0 },
        ],
      });

    const res = await request(app).get('/quizzes/1');
    expect(res.status).toBe(200);
    expect(res.body.title).toBe('Math Quiz');
    expect(res.body.questions).toHaveLength(1);
    expect(res.body.questions[0].question_text).toBe('What is 2+2?');
  });

  it('returns 404 for missing quiz', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });

    const res = await request(app).get('/quizzes/999');
    expect(res.status).toBe(404);
    expect(res.body.error).toMatch(/not found/);
  });
});

describe('POST /quizzes/:id/submit', () => {
  const app = buildApp();
  const token = jwt.sign({ userId: 'u1', role: 'student' }, TEST_SECRET);

  it('grades answers correctly and publishes events', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [
        { id: 'q1', correct_answer: 'Paris', explanation: 'Capital of France' },
        { id: 'q2', correct_answer: '4', explanation: '2+2=4' },
      ],
    });

    const res = await request(app)
      .post('/quizzes/1/submit')
      .set('Authorization', `Bearer ${token}`)
      .send({
        answers: [
          { questionId: 'q1', selectedAnswer: 'Paris', timeSpentMs: 1000 },
          { questionId: 'q2', selectedAnswer: '5', timeSpentMs: 800 },
        ],
      });

    expect(res.status).toBe(200);
    expect(res.body.correctCount).toBe(1);
    expect(res.body.totalQuestions).toBe(2);
    expect(res.body.accuracyPct).toBe(50);
    expect(res.body.results[0].isCorrect).toBe(true);
    expect(res.body.results[1].isCorrect).toBe(false);
    // Should have published 2 events
    expect(mockPublishEvent).toHaveBeenCalledTimes(2);
  });

  it('requires authentication', async () => {
    const res = await request(app)
      .post('/quizzes/1/submit')
      .send({ answers: [] });
    expect(res.status).toBe(401);
  });
});
