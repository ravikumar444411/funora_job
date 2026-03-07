const { Redis } = require("ioredis");

const redisHost = process.env.REDIS_HOST || "127.0.0.1";
const redisPort = Number(process.env.REDIS_PORT || 6379);
const redisDb = Number(process.env.REDIS_DB || 0);
const redisUsername = process.env.REDIS_USERNAME;
const redisPassword = process.env.REDIS_PASSWORD;
const useTls = String(process.env.REDIS_TLS || "false").toLowerCase() === "true";
const rejectUnauthorized = String(process.env.REDIS_TLS_REJECT_UNAUTHORIZED || "false").toLowerCase() === "true";

const redisOptions = {
  host: redisHost,
  port: redisPort,
  db: redisDb,
  username: redisUsername || undefined,
  password: redisPassword || undefined,
  maxRetriesPerRequest: null,
  retryStrategy: () => null
};

if (useTls) {
  redisOptions.tls = { rejectUnauthorized };
}

const redisConnection = new Redis(redisOptions);

redisConnection.on("connect", () => {
  console.log("✅ Connected to Redis successfully!");
});

redisConnection.on("error", (err) => {
  console.error("❌ Redis connection error:", err.message);
});

module.exports = redisConnection;
