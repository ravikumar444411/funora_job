// cronJob.js
const redis = require("../../config/redis");

// Example: set/get a value
(async () => {
    try {
        await redis.set("foo", "bar");
        const value = await redis.get("foo");
        console.log("🔑 Redis value for foo:", value);
    } catch (err) {
        console.error("Error in Redis operation:", err);
    }
})();
