
import {redis} from "./redis";

export async function ratelimit(
  key:string,
  limit:number,
  windowSec:number
){
  try {
    // Add a 1s timeout to prevent hanging when Redis is down
    const redisPromise = (async () => {
        const current = await redis.incr(key);
        if(current == 1){
          await redis.expire(key,windowSec);
        }
        return current <= limit;
    })();

    const timeoutPromise = new Promise<boolean>((_, reject) => 
        setTimeout(() => reject(new Error("Redis timeout")), 1000)
    );

    return await Promise.race([redisPromise, timeoutPromise]);
  } catch (err) {
    console.warn("[RateLimit] Redis unreachable or timed out, skipping limit check:", err instanceof Error ? err.message : err);
    return true; // Allow if Redis is down
  }
}