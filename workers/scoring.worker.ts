
import { Worker } from "bullmq";
import {redis }from "../infra/redis";

new Worker(

    "scoring-queue",
    async job =>{
        console.log("scoring job received : " , job.data);

    },
    {connection :redis.options}
)