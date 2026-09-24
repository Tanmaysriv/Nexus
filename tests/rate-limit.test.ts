import { describe, expect, it, beforeEach, vi } from "vitest";
import { checkRateLimit } from "../lib/rate-limit";

describe("NEXUS rate limiter", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "");
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "");
  });

  it("allows requests within the limit", async () => {
    const key = `test-allow-${Date.now()}`;

    const first = await checkRateLimit(key, 3, 60_000);
    const second = await checkRateLimit(key, 3, 60_000);

    expect(first.allowed).toBe(true);
    expect(first.remaining).toBe(2);

    expect(second.allowed).toBe(true);
    expect(second.remaining).toBe(1);
  });

  it("blocks requests after the limit", async () => {
    const key = `test-block-${Date.now()}`;

    await checkRateLimit(key, 2, 60_000);
    await checkRateLimit(key, 2, 60_000);

    const third = await checkRateLimit(key, 2, 60_000);

    expect(third.allowed).toBe(false);
    expect(third.remaining).toBe(0);
    expect(third.retryAfterSeconds).toBeGreaterThan(0);
  });
});

