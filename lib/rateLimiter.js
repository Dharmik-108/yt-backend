import { RateLimiterMemory } from 'rate-limiter-flexible';

export const rateLimiter = new RateLimiterMemory({
  points: 30,        
  duration: 60,       
  blockDuration: 300, 
});

export function getClientIP(req) {
  let ip =
    req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
    req.headers["x-real-ip"] ||
    req.socket?.remoteAddress;

  if (ip === "::1") ip = "127.0.0.1";
  return ip;
}
