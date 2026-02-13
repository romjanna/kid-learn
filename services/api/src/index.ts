import express from 'express';
import cors from 'cors';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { config } from './config';
import { pool } from './db/pool';
import { closeRedis } from './services/eventPublisher';
import { typeDefs } from './graphql/schema';
import { resolvers } from './graphql/resolvers';
import authRoutes from './routes/auth';
import quizRoutes from './routes/quizzes';
import lessonRoutes from './routes/lessons';
import progressRoutes from './routes/progress';

async function main() {
  const app = express();

  app.use(cors());
  app.use(express.json());

  // Health check
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', service: 'api' });
  });

  // REST routes
  app.use('/api/auth', authRoutes);
  app.use('/api/quizzes', quizRoutes);
  app.use('/api/lessons', lessonRoutes);
  app.use('/api/progress', progressRoutes);

  // GraphQL
  const apollo = new ApolloServer({ typeDefs, resolvers });
  await apollo.start();
  app.use('/graphql', expressMiddleware(apollo));

  app.listen(config.port, () => {
    console.log(`API server running on port ${config.port}`);
    console.log(`GraphQL playground at http://localhost:${config.port}/graphql`);
  });

  // Graceful shutdown
  process.on('SIGTERM', async () => {
    console.log('Shutting down...');
    await pool.end();
    await closeRedis();
    process.exit(0);
  });
}

main().catch((err) => {
  console.error('Failed to start API:', err);
  process.exit(1);
});
