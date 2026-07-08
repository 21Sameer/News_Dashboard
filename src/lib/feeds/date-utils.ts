// Centralized publish-date handling so the app NEVER fabricates freshness.
//
// Root cause this guards against: some RSS/Atom feeds omit per-item dates.
// Previously the code fell back to `new Date()`, which made old, undated
// articles masquerade as brand-new ("1 minute ago"), rank with max recency,
// and sort to the top. We now require a real, sane publish date; anything we
// can't verify is treated as not-fresh and excluded.

/** Items older than this are considered stale and are dropped from feeds. */
export const MAX_CONTENT_AGE_MS = 21 * 24 * 60 * 60 * 1000; // 21 days

/** Small tolerance for feeds whose clocks run slightly ahead. */
const FUTURE_TOLERANCE_MS = 12 * 60 * 60 * 1000; // 12 hours

/** Possible date-bearing fields across RSS, Atom, and Dublin Core. */
const DATE_FIELDS = [
  'isoDate',
  'pubDate',
  'published',
  'updated',
  'date',
  'dc:date',
  'dcDate',
  'a:published',
  'a:updated',
  'lastBuildDate',
] as const;

/**
 * Extract a valid, sane publish date from a parsed feed item.
 * Returns an ISO string, or `null` if no trustworthy date exists.
 */
export function extractValidDate(item: Record<string, unknown>): string | null {
  const now = Date.now();

  for (const field of DATE_FIELDS) {
    const raw = item[field];
    if (typeof raw !== 'string' || !raw.trim()) continue;

    const parsed = new Date(raw).getTime();
    if (Number.isNaN(parsed)) continue;

    // Reject absurd dates (pre-2000) and dates meaningfully in the future.
    if (parsed < 946684800000) continue; // 2000-01-01
    if (parsed > now + FUTURE_TOLERANCE_MS) continue;

    return new Date(parsed).toISOString();
  }

  return null;
}

/** True when an item has a valid date and is within the freshness window. */
export function isFresh(publishedAt: string | null | undefined): boolean {
  if (!publishedAt) return false;
  const t = new Date(publishedAt).getTime();
  if (Number.isNaN(t)) return false;
  return Date.now() - t <= MAX_CONTENT_AGE_MS;
}
