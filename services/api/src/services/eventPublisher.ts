import Redis from 'ioredis';
import { config } from '../config';

const redis = new Redis(config.redisUrl);

export async function publishEvent(channel: string, event: object): Promise<void> {
  await redis.publish(channel, JSON.stringify(event));
}

export async function closeRedis(): Promise<void> {
  await redis.quit();
}
