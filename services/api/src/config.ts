export const config = {
  port: parseInt(process.env.PORT || '3000'),
  databaseUrl: process.env.DATABASE_URL || 'postgresql://kidlearn:kidlearn_local@localhost:5432/kidlearn',
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  jwtSecret: process.env.JWT_SECRET || 'dev-secret-change-me',
  nodeEnv: process.env.NODE_ENV || 'development',
};
