import { groqChat, type GroqMessage } from '@/lib/groq';
import { getAllFeedItems } from '@/lib/feeds/fetch-all-feeds';
import { isFresh } from '@/lib/feeds/date-utils';
import type { Category, NewsItem } from '@/types';

export const dynamic = 'force-dynamic';

function inferCategory(query: string): Category | null {
  const q = query.toLowerCase();
  if (/\b(ai|llm|gpt|claude|gemini|model|agent|mlops|machine learning)\b/.test(q)) return 'ai';
  if (/\b(crypto|bitcoin|btc|ethereum|eth|defi|solana|token)\b/.test(q)) return 'crypto';
  if (/\b(trading|stocks|markets?|forex|fx|commodit|futures|options|earnings)\b/.test(q)) return 'trading';
  if (/\b(github|open source|repo|repository|framework|library|devops)\b/.test(q)) return 'github';
  if (/\b(research|paper|arxiv|preprint|study)\b/.test(q)) return 'research';
  if (/\b(startup|funding|series|vc|venture|ipo)\b/.test(q)) return 'startups';
  if (/\b(geopolitic|global|world|government|policy|sanction)\b/.test(q)) return 'global';
  if (/\b(tech|technology|chip|hardware|cloud|apple|google|microsoft|nvidia)\b/.test(q)) return 'tech';
  return null;
}

function formatOffline(items: NewsItem[], query: string): string {
  const category = inferCategory(query);
  const pool = (category ? items.filter((i) => i.category === category) : items)
    .filter((i) => isFresh(i.publishedAt))
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
    .slice(0, 6);

  if (pool.length === 0) {
    return (
      'I can’t reach the full AI model right now, and there aren’t enough fresh headlines available to answer reliably. ' +
      'Try again in a moment or set `GROQ_API_KEY` to enable full intelligence analysis.'
    );
  }

  const bullets = pool
    .slice(0, 5)
    .map((i) => `• ${i.title}`)
    .join('\n');

  return (
    `Offline analyst mode (no Groq key detected). Here are the freshest signals I can see right now${category ? ` in ${category.toUpperCase()}` : ''}:\n` +
    `${bullets}\n\n` +
    'Set `GROQ_API_KEY` and restart the dev server to enable deep, conversational analysis.'
  );
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
    }
    const messages: GroqMessage[] = body.messages ?? [];

    if (!messages.length) {
      return Response.json({ error: 'No messages provided' }, { status: 400 });
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      const all = await getAllFeedItems(false).catch(() => []);
      const lastUser = [...messages].reverse().find((m) => m.role === 'user')?.content ?? '';
      const content = formatOffline(all, lastUser);
      return Response.json({ content, mode: 'offline' as const });
    }

    const system: GroqMessage = {
      role: 'system',
      content:
        'You are NewsDash AI — a concise intelligence analyst. Answer questions about news, markets, crypto, AI, and technology clearly in plain language. Keep responses under 200 words unless the user asks for detail. Prefer actionable, prioritized insights. If the user asks for “fresh”, prefer the newest items.',
    };

    const content = await groqChat([system, ...messages], {
      maxTokens: 700,
      temperature: 0.35,
    });

    return Response.json({ content, mode: 'groq' as const });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'AI chat failed';
    return Response.json({ error: message }, { status: 500 });
  }
}
