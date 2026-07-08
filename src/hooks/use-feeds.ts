'use client';

import { useQuery } from '@tanstack/react-query';
import type { NewsItem, CryptoAsset, GithubRepo, ResearchPaper, HackerNewsStory, Category, FeedResponse } from '@/types';
import { useSettings } from '@/components/providers/settings-provider';

export function useFeeds(category?: Category, limit = 30, module?: string) {
  const { settings } = useSettings();
  const isHome = !category && !module;
  const customSig = isHome ? settings.customSources.map((s) => s.url).join('|') : '';
  const refetchInterval = settings.refreshInterval > 0 ? settings.refreshInterval : false;

  return useQuery<FeedResponse>({
    queryKey: ['feeds', category, module, limit, customSig],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (module) params.set('module', module);
      else if (category) params.set('category', category);
      params.set('limit', String(limit));
      const res = await fetch(`/api/feeds?${params}`);
      if (!res.ok) throw new Error('Failed to fetch feeds');
      const data: FeedResponse = await res.json();

      // Blend user-added custom sources into the global (home) feed only.
      // Capped with an abort so a slow source never stalls the main feed.
      if (isHome && settings.customSources.length > 0) {
        try {
          const controller = new AbortController();
          const abortTimer = setTimeout(() => controller.abort(), 10000);
          const customRes = await fetch('/api/custom-feed', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sources: settings.customSources }),
            signal: controller.signal,
          }).finally(() => clearTimeout(abortTimer));
          if (customRes.ok) {
            const customData: { items: NewsItem[] } = await customRes.json();
            const seen = new Set<string>();
            const merged = [...(customData.items ?? []), ...data.items].filter((item) => {
              if (seen.has(item.url)) return false;
              seen.add(item.url);
              return true;
            });
            merged.sort(
              (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
            );
            return { ...data, items: merged, total: merged.length };
          }
        } catch {
          // fall back to base feed on any custom-source failure
        }
      }

      return data;
    },
    staleTime: 30 * 1000,
    refetchInterval,
  });
}

export function useCryptoMarket() {
  return useQuery<{ assets: CryptoAsset[]; lastUpdated: string }>({
    queryKey: ['crypto', 'market'],
    queryFn: async () => {
      const res = await fetch('/api/crypto/market');
      if (!res.ok) throw new Error('Failed to fetch crypto market');
      return res.json();
    },
    refetchInterval: 2 * 60 * 1000,
  });
}

export function useGithubTrending() {
  return useQuery<{ repos: GithubRepo[]; lastUpdated: string }>({
    queryKey: ['github', 'trending'],
    queryFn: async () => {
      const res = await fetch(`/api/github/trending?t=${Date.now()}`);
      if (!res.ok) throw new Error('Failed to fetch GitHub trending');
      return res.json();
    },
    refetchInterval: 15 * 60 * 1000,
  });
}

export function useResearchPapers() {
  return useQuery<{ papers: ResearchPaper[]; lastUpdated: string }>({
    queryKey: ['research', 'papers'],
    queryFn: async () => {
      const res = await fetch('/api/research/papers');
      if (!res.ok) throw new Error('Failed to fetch research papers');
      return res.json();
    },
    refetchInterval: 30 * 60 * 1000,
  });
}

export function useHackerNews() {
  return useQuery<{ stories: HackerNewsStory[]; lastUpdated: string }>({
    queryKey: ['hackernews'],
    queryFn: async () => {
      const res = await fetch('/api/hackernews');
      if (!res.ok) throw new Error('Failed to fetch HackerNews');
      return res.json();
    },
    refetchInterval: 5 * 60 * 1000,
  });
}
