import { Pool } from 'pg';
import { config } from '../config';

export const pool = new Pool({
  connectionString: config.databaseUrl,
  max: 10,
});

pool.on('error', (err) => {
  console.error('Unexpected database pool error:', err);
});
