import dotenv from "dotenv";
dotenv.config();

import Redis from "ioredis";

const REDIS_URL = process.env.REDIS_URL;

if (!REDIS_URL) {
    throw new Error("REDIS_URL is not defined");
}

const redis = new Redis(REDIS_URL);

redis.on("connect" ,()=>{
    console.log(`Connected to Redis Server`)
})

redis.on("error" , (e)=>{
    console.log(`Error Occurred while connecting to redis ` , e)
})

export default redis;