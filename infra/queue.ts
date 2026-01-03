// Queue setup
// import { Queue } from 'bullmq';
// export const myQueue = new Queue('my-queue');

import {Queue} from "bullmq";
import {redis} from "./redis";


export const scoringQueue = new Queue("scoring-queue"  ,{
    connection:redis.options
});
export const reportQueue =new Queue("report-queue",{
    connection:redis.options
})