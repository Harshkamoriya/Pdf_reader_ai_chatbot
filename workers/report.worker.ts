import { Worker } from "bullmq";
import { redis } from "../infra/redis";

new Worker(
  "report-queue",
  async job => {
    console.log("Report job received:", job.data);
  },
  { connection: redis.options }
);
