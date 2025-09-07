const Redis = require("ioredis");

const client = new Redis(
  "rediss://default:ART9AAImcDEzMDMwNWY1NTNiOWE0ZTM3YTk5ZmRiY2RhY2FmOTQ5OHAxNTM3Mw@upward-horse-5373.upstash.io:6379"
);

client.on("connect", () => {
  console.log("Redis connected successfully");
});

client.on("error", (err) => {
  console.error("Redis connection error:", err);
});

module.exports = client;
