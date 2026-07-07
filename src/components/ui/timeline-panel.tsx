'use client';

import type { NewsItem } from '@/types';
import { format } from 'date-fns';
import { useEffect, useMemo, useState } from 'react';

interface TimelineEvent {
  time: Date;
  title: string;
  category: string;
  importance: 'high' | 'medium';
  url: string;
}

function buildTimeline(items: NewsItem[], limit: number): TimelineEvent[] {
  const dayAgo = Date.now() - 24 * 60 * 60 * 1000;
  return items
    .filter((i) => new Date(i.publishedAt).getTime() >= dayAgo)
    .slice()
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
    .slice(0, limit)
    .map((item) => ({
      time: new Date(item.publishedAt),
      title: item.title,
      category: item.category,
      importance: item.significance >= 8 ? ('high' as const) : ('medium' as const),
      url: item.url,
    }));
}

export function TimelinePanel({ items }: { items: NewsItem[] }) {
  const [open, setOpen] = useState(false);
  const timeline = useMemo(() => buildTimeline(items, 6), [items]);
  const fullTimeline = useMemo(() => buildTimeline(items, 24), [items]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    if (open) window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const openEvent = (url: string) => {
    if (!url) return;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <>
      <div className="panel">
        <div className="panel-header">
          <h3>Global Operations Timeline</h3>
          <button
            type="button"
            className="panel-action"
            onClick={() => setOpen(true)}
            aria-label="Open full timeline"
          >
            Full View
          </button>
        </div>
        <div className="panel-body">
          <div className="timeline-list">
            {timeline.length === 0 ? (
              <p style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', padding: '8px 0' }}>
                Syncing live timeline — check back in a moment.
              </p>
            ) : (
              timeline.map((event, i) => (
                <div
                  key={`${event.time.toISOString()}-${i}`}
                  className="timeline-item"
                  tabIndex={0}
                  role="button"
                  onClick={() => openEvent(event.url)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') openEvent(event.url);
                  }}
                  aria-label={`Open: ${event.title}`}
                  title="Open source article"
                >
                  <div className="timeline-time">{format(event.time, 'HH:mm')}</div>
                  <div className={`timeline-dot ${event.importance}`} />
                  <div className="timeline-content">
                    <h4>{event.title}</h4>
                    <p
                      style={{
                        textTransform: 'uppercase',
                        fontSize: '0.65rem',
                        color: 'var(--accent-cyan)',
                        fontWeight: 600,
                      }}
                    >
                      {event.category}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div
        className={`modal-overlay${open ? ' open' : ''}`}
        onClick={() => setOpen(false)}
        role="presentation"
      >
        <div className="modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
          <div className="modal-header">
            <h2>⏱️ Global Operational Timeline (24h Logs)</h2>
            <button type="button" className="modal-close" onClick={() => setOpen(false)} aria-label="Close">
              ×
            </button>
          </div>
          <div className="modal-body">
            <p style={{ marginBottom: 16, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Chronological logs of global market, technology, and geopolitical events recorded in the last 24 hours.
            </p>
            <div className="timeline-list" style={{ marginTop: 10 }}>
              {fullTimeline.length === 0 ? (
                <p style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', padding: '8px 0' }}>
                  Syncing live timeline — check back in a moment.
                </p>
              ) : (
                fullTimeline.map((event, i) => (
                  <div
                    key={`${event.time.toISOString()}-full-${i}`}
                    className="timeline-item"
                    style={{ padding: '14px 0' }}
                    tabIndex={0}
                    role="button"
                    onClick={() => openEvent(event.url)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') openEvent(event.url);
                    }}
                    aria-label={`Open: ${event.title}`}
                    title="Open source article"
                  >
                    <div className="timeline-time" style={{ width: 50 }}>
                      {format(event.time, 'HH:mm')}
                    </div>
                    <div className={`timeline-dot ${event.importance}`} />
                    <div className="timeline-content">
                      <h4 style={{ fontSize: '0.9rem', fontWeight: 600 }}>{event.title}</h4>
                      <p
                        style={{
                          textTransform: 'uppercase',
                          fontSize: '0.7rem',
                          color: 'var(--accent-cyan)',
                          fontWeight: 600,
                          marginTop: 2,
                        }}
                      >
                        {event.category}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end' }}>
              <button type="button" className="btn btn-primary" onClick={() => setOpen(false)}>
                Acknowledge Logs
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
