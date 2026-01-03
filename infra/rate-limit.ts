
import {redis} from "./redis";

export async function ratelimit(
  key:string,
  limit:number,
  windowSec:number
){
  const current = await redis.incr(key);

  if(current == 1){
    await redis.expire(key,windowSec);
  }
  return current <= limit;
}