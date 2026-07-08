'use client';

import { useState } from 'react';
import { useFeeds } from '@/hooks/use-feeds';
import { NewsCard } from '@/components/cards/news-card';
import { ImportanceScore } from '@/components/ui/importance-score';
import { formatDistanceToNow } from 'date-fns';
import type { Category, NewsItem } from '@/types';

export interface ModulePageConfig {
  title: string;
  subtitle: string;
  icon?: string;
  iconClass?: string;
  category?: Category;
  moduleId?: string;
  subcategories: string[];
  showLive?: boolean;
}

function FeaturedCard({ item }: { item: NewsItem }) {
  const timeStr = formatDistanceToNow(new Date(item.publishedAt), { addSuffix: true }).replace('about ', '');
  const isBreaking = item.significance >= 9;
  const open = () => window.open(item.url, '_blank', 'noopener,noreferrer');

  return (
    <div
      className={`featured-card ${isBreaking ? 'breaking' : ''} animate-fade-in`}
      onClick={open}
      onKeyDown={(e) => e.key === 'Enter' && open()}
      tabIndex={0}
      role="button"
      aria-label={`Open article: ${item.title}`}
    >
      <div style={{ display: 'flex', gap: 20, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'flex-start', width: '100%' }}>
        {item.imageUrl && (
          <div className="featured-thumbnail-container" style={{ flex: '1 1 200px', maxWidth: '100%' }}>
            <img
              src={item.imageUrl}
              alt={item.title}
              className="card-thumbnail featured-thumbnail"
              onError={(e) => { (e.target as HTMLImageElement).parentElement!.style.display = 'none'; }}
              style={{ width: '100%', height: 'auto', maxHeight: 200, objectFit: 'cover', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}
            />
          </div>
        )}
        <div style={{ flex: '2 1 300px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap', marginBottom: 8 }}>
            <div className={`featured-badge ${isBreaking ? 'breaking' : 'featured'}`} style={{ margin: 0 }}>
              {isBreaking ? 'BREAKING INTELLIGENCE' : 'FEATURED REPORT'}
            </div>
            {item.subcategory && (
              <span
                className="card-badge subcategory"
                style={{
                  background: 'rgba(99,102,241,0.15)',
                  color: 'var(--accent-indigo)',
                  padding: '4px 8px',
                  borderRadius: 4,
                  fontSize: '0.68rem',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                }}
              >
                {item.subcategory}
              </span>
            )}
          </div>
          <h3>{item.title}</h3>
          <div className="featured-meta">
            <span className="source">
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                style={{ color: 'var(--accent-cyan)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 2 }}
              >
                {item.source} ↗
              </a>
            </span>
            <span className="time-ago">{timeStr}</span>
            <ImportanceScore score={item.significance} />
          </div>
          {item.description && <p className="featured-summary">{item.description}</p>}
          {item.tags.length > 0 && (
            <div className="featured-tags">
              {item.tags.slice(0, 4).map((t) => (
                <span key={t} className="tag">#{t}</span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Real-world keyword synonyms so each sub-category tab matches the language
// actually used in article titles/descriptions (keyed by lowercased label).
const SUBCATEGORY_SYNONYMS: Record<string, string[]> = {
  // Technology
  hardware: ['hardware', 'chip', 'gpu', 'cpu', 'processor', 'device', 'laptop', 'phone', 'silicon', 'apple', 'intel', 'amd'],
  cloud: ['cloud', 'aws', 'azure', 'gcp', 'kubernetes', 'serverless', 'saas', 'datacenter', 'data center'],
  robotics: ['robot', 'robotic', 'automation', 'drone', 'humanoid', 'boston dynamics'],
  quantum: ['quantum', 'qubit', 'superconduct'],
  space: ['space', 'nasa', 'spacex', 'satellite', 'rocket', 'orbit', 'mars', 'lunar', 'astronaut'],
  semiconductors: ['semiconductor', 'chip', 'tsmc', 'nvidia', 'wafer', 'fab', 'lithography', 'nm '],
  // AI
  models: ['model', 'gpt', 'llm', 'llama', 'gemini', 'claude', 'mistral', 'transformer', 'multimodal'],
  research: ['research', 'paper', 'study', 'arxiv', 'preprint', 'benchmark', 'findings'],
  tools: ['tool', 'sdk', 'api', 'framework', 'library', 'plugin', 'app', 'platform'],
  agents: ['agent', 'agentic', 'autonomous', 'copilot', 'assistant', 'workflow'],
  infrastructure: ['infrastructure', 'gpu', 'training', 'cluster', 'compute', 'datacenter', 'inference', 'mlops'],
  // Cybersecurity
  'breaches & incidents': ['breach', 'hack', 'hacked', 'leak', 'exposed', 'incident', 'data breach', 'compromis', 'stolen'],
  'vulnerabilities & cves': ['vulnerability', 'vulnerabilities', 'cve', 'flaw', 'patch', 'zero-day', 'zero day', 'exploit', 'bug'],
  'threat intel': ['threat', 'apt', 'nation-state', 'espionage', 'campaign', 'actor', 'intelligence'],
  'ransomware & malware': ['ransomware', 'malware', 'trojan', 'botnet', 'phishing', 'spyware', 'worm', 'backdoor'],
  'security research': ['research', 'disclosure', 'analysis', 'poc', 'reverse', 'bounty', 'security'],
  // GitHub
  ai: ['ai', 'ml', 'llm', 'model', 'gpt', 'neural', 'machine learning'],
  devops: ['devops', 'ci/cd', 'pipeline', 'docker', 'kubernetes', 'terraform', 'deploy', 'automation'],
  'web dev': ['web', 'javascript', 'typescript', 'react', 'next', 'vue', 'frontend', 'css', 'node'],
  languages: ['rust', 'python', 'go ', 'golang', 'java', 'c++', 'kotlin', 'swift', 'language', 'compiler'],
  // Research
  'academic papers': ['paper', 'arxiv', 'study', 'journal', 'preprint', 'research', 'peer-review'],
  engineering: ['engineering', 'system', 'design', 'architecture', 'build', 'infrastructure'],
  'space research': ['space', 'nasa', 'astro', 'cosmo', 'satellite', 'physics', 'telescope'],
  // Startups
  'funding rounds': ['funding', 'raise', 'raised', 'seed', 'series a', 'series b', 'series c', 'round', 'million', 'billion', 'investment'],
  ipos: ['ipo', 'public offering', 'goes public', 'listing', 'debut', 'nasdaq', 'nyse'],
  'vc activity': ['vc', 'venture', 'investor', 'fund', 'capital', 'backed', 'valuation', 'unicorn'],
  launches: ['launch', 'unveil', 'debut', 'announce', 'introduces', 'release', 'rollout'],
  // Crypto
  bitcoin: ['bitcoin', 'btc', 'satoshi', 'halving'],
  ethereum: ['ethereum', 'eth', 'vitalik', 'staking', 'layer 2', 'l2'],
  defi: ['defi', 'yield', 'liquidity', 'protocol', 'dex', 'lending', 'stablecoin'],
  regulations: ['regulation', 'sec', 'lawsuit', 'legal', 'ban', 'compliance', 'court', 'government'],
  exchanges: ['exchange', 'binance', 'coinbase', 'kraken', 'listing', 'trading'],
  // Trading
  forex: ['forex', 'fx', 'currency', 'dollar', 'euro', 'yen', 'pound', 'usd', 'eur', 'exchange rate'],
  commodities: ['commodity', 'oil', 'gold', 'silver', 'gas', 'crude', 'metal', 'wheat', 'copper'],
  etfs: ['etf', 'fund', 'index fund', 'vanguard', 'ishares'],
  futures: ['futures', 'contract', 'derivative', 'options', 'hedge'],
  earnings: ['earnings', 'revenue', 'profit', 'quarter', 'results', 'guidance', 'q1', 'q2', 'q3', 'q4'],
  // Global
  government: ['government', 'president', 'congress', 'senate', 'policy', 'law', 'minister', 'parliament', 'election'],
  'economic events': ['economy', 'economic', 'gdp', 'inflation', 'recession', 'growth', 'jobs', 'unemployment', 'rate'],
  international: ['international', 'global', 'world', 'foreign', 'treaty', 'summit', 'nations', 'diplomatic'],
  // Cloud & DevOps
  'cloud providers': ['aws', 'azure', 'gcp', 'google cloud', 'cloudflare', 'oracle cloud', 'cloud'],
  'devops infrastructure': ['devops', 'kubernetes', 'docker', 'terraform', 'ci/cd', 'pipeline', 'observability', 'infrastructure'],
  // Forex module
  'central bank decisions': ['central bank', 'fed', 'ecb', 'boe', 'boj', 'federal reserve', 'rate decision', 'monetary'],
  'currency markets': ['currency', 'forex', 'fx', 'dollar', 'euro', 'yen', 'pound', 'exchange rate'],
  'interest rates': ['interest rate', 'rate hike', 'rate cut', 'yield', 'basis points', 'fed', 'monetary'],
  'inflation reports': ['inflation', 'cpi', 'ppi', 'price index', 'deflation', 'consumer price'],
  'economic indicators': ['gdp', 'jobs', 'employment', 'pmi', 'retail sales', 'economic', 'data'],
  // Gold module
  gold: ['gold', 'bullion', 'xau', 'precious metal'],
  silver: ['silver', 'xag'],
  'platinum & palladium': ['platinum', 'palladium', 'pgm'],
  'mining & supply': ['mining', 'miner', 'supply', 'production', 'reserve', 'ore'],
  'commodities & energy': ['commodity', 'oil', 'gas', 'energy', 'crude', 'copper', 'metal'],
  'market analysis': ['analysis', 'outlook', 'forecast', 'price', 'target', 'trend', 'rally', 'selloff'],
};

// Minimum items to keep a tab from looking sparse/empty.
const MIN_TAB_ITEMS = 6;

function filterBySubcategory(items: NewsItem[], subcategory: string): NewsItem[] {
  if (subcategory === 'All') return items;

  const key = subcategory.toLowerCase();
  const target = key.replace(/&/g, 'and');
  const targetWords = target.split(/[^a-z0-9]+/).filter((w) => w.length > 2);
  const synonyms = SUBCATEGORY_SYNONYMS[key] ?? [];
  const keywords = Array.from(new Set([...synonyms, ...targetWords, target].filter(Boolean)));

  const matches = items.filter((item) => {
    const hay = `${item.subcategory ?? ''} ${item.tags.join(' ')} ${item.title} ${item.description ?? ''} ${item.source}`
      .toLowerCase()
      .replace(/&/g, 'and');
    return keywords.some((k) => hay.includes(k));
  });

  if (matches.length >= MIN_TAB_ITEMS) return matches;

  // Never leave a sub-category empty: pad with the most recent remaining
  // items (relevant matches stay first) so every tab shows meaningful news.
  const seen = new Set(matches.map((i) => i.id));
  const filler = items
    .filter((i) => !seen.has(i.id))
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
    .slice(0, MIN_TAB_ITEMS - matches.length);

  return [...matches, ...filler];
}

export function ModulePageLayout({ config }: { config: ModulePageConfig }) {
  const [activeTab, setActiveTab] = useState('All');
  const { data, isLoading } = useFeeds(config.category, 50, config.moduleId);

  const allItems = data?.items ?? [];
  const filtered = filterBySubcategory(allItems, activeTab);

  const sortedByImportance = [...filtered].sort((a, b) => {
    const aScore = (a.significance >= 9 ? 100 : 0) + (a.significance || 5);
    const bScore = (b.significance >= 9 ? 100 : 0) + (b.significance || 5);
    return bScore - aScore || new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
  });

  const featured = sortedByImportance[0];
  const gridNews = filtered
    .filter((item) => item.id !== featured?.id)
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

  return (
    <>
      <div className="module-header animate-fade-in">
        <div className="module-header-top">
          <div className="module-title-group">
            {config.icon && (
              <div className={`module-icon ${config.iconClass ?? ''}`}>{config.icon}</div>
            )}
            <div className="module-title">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <h2>{config.title}</h2>
                {config.showLive && (
                  <span
                    className="live-indicator"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      fontSize: '0.72rem',
                      color: 'var(--accent-emerald)',
                      background: 'rgba(16, 185, 129, 0.08)',
                      padding: '4px 8px',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid rgba(16, 185, 129, 0.2)',
                      fontWeight: 600,
                    }}
                  >
                    <span
                      className="live-dot"
                      style={{
                        width: 6,
                        height: 6,
                        backgroundColor: 'var(--accent-emerald)',
                        borderRadius: '50%',
                        boxShadow: '0 0 8px var(--accent-emerald)',
                      }}
                    />
                    Live · auto-refreshing
                  </span>
                )}
              </div>
              <p>{config.subtitle}</p>
            </div>
          </div>
        </div>
        <div className="category-tabs" style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'flex-start', width: '100%' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {config.subcategories.map((cat) => (
              <button
                key={cat}
                type="button"
                className={`cat-tab${activeTab === cat ? ' active' : ''}`}
                onClick={() => setActiveTab(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="content-grid">
        <div className="content-main">
          {isLoading ? (
            <p style={{ fontSize: '0.82rem', color: 'var(--text-tertiary)', padding: '20px 0' }}>
              Synchronizing intelligence feed…
            </p>
          ) : (
            <>
              {featured && <FeaturedCard item={featured} />}
              {gridNews.length > 0 ? (
                <div className="news-grid">
                  {gridNews.map((item) => (
                    <NewsCard key={item.id} item={item} />
                  ))}
                </div>
              ) : !featured ? (
                <div className="empty-state">
                  <div className="empty-icon">📭</div>
                  <h3>No intelligence reports found</h3>
                  <p>Try switching sub-categories or search for a different topic.</p>
                </div>
              ) : null}
            </>
          )}
        </div>
      </div>
    </>
  );
}
