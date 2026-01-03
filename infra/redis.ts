// Redis connection setup
// import { createClient } from 'redis';
// export const redis = createClient();

import Redis from "ioredis";

export const redis = new Redis(process.env.REDIS_URL as string);