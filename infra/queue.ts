import {Queue} from "bullmq";
import {getSafeRedisConnection} from "./redis";

const connection = getSafeRedisConnection();

export const scoringQueue = new Queue("scoring-queue"  ,{
    connection
});
export const reportQueue =new Queue("report-queue",{
    connection
})