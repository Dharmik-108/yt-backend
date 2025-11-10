import { rateLimiter, getClientIP } from './rateLimiter.js';

export function withRateLimit(handler) {
  return async (req, res) => {
    const ip = getClientIP(req);

    try {
      await rateLimiter.consume(ip);
    } catch {
      return res
        .status(429)
        .json({ error: "Too many requests. Please try again later." });
    }

    return handler(req, res);
  };
}
