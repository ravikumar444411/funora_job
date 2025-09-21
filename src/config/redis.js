const Redis = require("ioredis");

const redisConnection = new Redis({
    host: "pet-camel-6825.upstash.io",  // Upstash host (without rediss://)
    port: 6379,                         // Upstash port
    password: "ARqpAAImcDI5MmZmZmIzNjRjYWM0OGU5YTg2MDUyOTRiNjk2MmE2NXAyNjgyNQ", // your Upstash password
    tls: {},                            // Required for secure "rediss://"
    maxRetriesPerRequest: null,         // recommended for Upstash serverless
    enableReadyCheck: false             // recommended for Upstash serverless
});

redisConnection.on("connect", () => {
    console.log("✅ Connected to Redis successfully!");
});

redisConnection.on("error", (err) => {
    console.error("❌ Redis connection error:", err);
});

module.exports = redisConnection;
