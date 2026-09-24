import type { RepositorySignals } from "@/lib/project-health";
import { analyzeRepository } from "@/lib/repository-analyzer";

type CacheEntry = {
  data: RepositorySignals;
  expiresAt: number;
};

const cache = new Map<string, CacheEntry>();

const CACHE_DURATION = 60 * 60 * 1000; // 1 hour

export async function getCachedRepositoryAnalysis(
  userId: string,
  owner: string,
  repo: string
): Promise<RepositorySignals> {
  const key = `${userId}:${owner}/${repo}`;

  const existing = cache.get(key);

  if (
    existing &&
    existing.expiresAt > Date.now()
  ) {
    return existing.data;
  }

  const data = await analyzeRepository(
    userId,
    owner,
    repo
  );

  cache.set(key, {
    data,
    expiresAt:
      Date.now() + CACHE_DURATION,
  });

  return data;
}

