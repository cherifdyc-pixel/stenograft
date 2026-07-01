import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { NextRequest, NextResponse } from "next/server";

// Partagé entre toutes les routes — connexion unique
const redis = new Redis({
  url:   process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// 5 inscriptions par IP par heure
export const signupLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, "1 h"),
  prefix:  "rl:signup",
});

// 10 grafts par user par minute
export const graftLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, "1 m"),
  prefix:  "rl:graft",
});

// 5 tokens live par user par minute
export const liveLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, "1 m"),
  prefix:  "rl:live",
});

// Helper : retourne l'IP réelle en tenant compte des proxies Vercel
export function getIp(req: NextRequest): string {
  return (
    req.headers.get("x-real-ip") ??
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "127.0.0.1"
  );
}

// Helper : construit la réponse 429 uniforme
export function tooMany(retryAfter: number): NextResponse {
  return NextResponse.json(
    { error: "Trop de requêtes. Réessaie dans quelques instants.", retryAfter },
    {
      status: 429,
      headers: {
        "Retry-After": String(retryAfter),
        "X-RateLimit-Limit": "exceeded",
      },
    },
  );
}
