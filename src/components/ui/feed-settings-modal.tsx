'use client';

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  Check,
  Gauge,
  Palette,
  Plus,
  Rss,
  Trash2,
  X,
} from 'lucide-react';
import {
  ACCENT_PRESETS,
  REFRESH_OPTIONS,
  useSettings,
} from '@/components/providers/settings-provider';
import { CATEGORIES } from '@/lib/feeds/registry';
import type { Category } from '@/types';

interface FeedSettingsModalProps {
  open: boolean;
  onClose: () => void;
}

type Tab = 'feed' | 'appearance' | 'sources';

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'feed', label: 'Feed', icon: <Gauge size={15} /> },
  { id: 'appearance', label: 'Appearance', icon: <Palette size={15} /> },
  { id: 'sources', label: 'Sources', icon: <Rss size={15} /> },
];

function Toggle({
  checked,
  onChange,
  label,
  hint,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  hint?: string;
}) {
  return (
    <div className="fs-row">
      <div className="fs-row-text">
        <span className="fs-row-label">{label}</span>
        {hint && <span className="fs-row-hint">{hint}</span>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        className={`fs-toggle${checked ? ' is-on' : ''}`}
        onClick={() => onChange(!checked)}
      >
        <span className="fs-toggle-knob" />
      </button>
    </div>
  );
}

export function FeedSettingsModal({ open, onClose }: FeedSettingsModalProps) {
  const {
    settings,
    updateSettings,
    addCustomSource,
    removeCustomSource,
    resetSettings,
  } = useSettings();
  const queryClient = useQueryClient();

  const [tab, setTab] = useState<Tab>('feed');
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [category, setCategory] = useState<Category>('tech');
  const [error, setError] = useState('');

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  const handleForceRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['feeds'] });
    queryClient.invalidateQueries({ queryKey: ['briefing'] });
    onClose();
  };

  const handleAddSource = () => {
    const trimmedUrl = url.trim();
    if (!trimmedUrl) {
      setError('Please paste an RSS/Atom feed URL.');
      return;
    }
    try {
      const parsed = new URL(trimmedUrl);
      if (!/^https?:$/.test(parsed.protocol)) throw new Error('bad protocol');
    } catch {
      setError('That does not look like a valid URL.');
      return;
    }
    if (settings.customSources.some((s) => s.url === trimmedUrl)) {
      setError('This source has already been added.');
      return;
    }
    addCustomSource({
      name: name.trim() || new URL(trimmedUrl).hostname.replace(/^www\./, ''),
      url: trimmedUrl,
      category,
    });
    setName('');
    setUrl('');
    setError('');
  };

  return (
    <div
      className={`modal-overlay${open ? ' open' : ''}`}
      onClick={handleOverlayClick}
      aria-hidden={!open}
    >
      <div
        className="modal feed-settings-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Feed Settings"
      >
        <div className="modal-header">
          <h2>
            <Gauge size={18} style={{ color: 'var(--accent-cyan)' }} />
            Feed Settings
          </h2>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Close settings">
            <X size={18} />
          </button>
        </div>

        <div className="fs-tabs">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              className={`fs-tab${tab === t.id ? ' is-active' : ''}`}
              onClick={() => setTab(t.id)}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>

        <div className="modal-body fs-body">
          {tab === 'feed' && (
            <div className="fs-section">
              <div className="fs-field">
                <span className="fs-field-label">Refresh interval</span>
                <div className="fs-segmented">
                  {REFRESH_OPTIONS.map((opt) => (
                    <button
                      key={opt.label}
                      type="button"
                      className={`fs-segment${settings.refreshInterval === opt.value ? ' is-active' : ''}`}
                      onClick={() => updateSettings({ refreshInterval: opt.value })}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
                <span className="fs-field-hint">
                  How often live feeds refresh in the background. Choose Manual to only refresh on demand.
                </span>
              </div>

              <button type="button" className="fs-primary-btn" onClick={handleForceRefresh}>
                Refresh all feeds now
              </button>
            </div>
          )}

          {tab === 'appearance' && (
            <div className="fs-section">
              <div className="fs-field">
                <span className="fs-field-label">Accent color</span>
                <div className="fs-swatches">
                  {ACCENT_PRESETS.map((preset) => (
                    <button
                      key={preset.key}
                      type="button"
                      title={preset.label}
                      aria-label={preset.label}
                      className={`fs-swatch${settings.accent === preset.key ? ' is-active' : ''}`}
                      style={{ ['--swatch' as string]: preset.color }}
                      onClick={() => updateSettings({ accent: preset.key })}
                    >
                      {settings.accent === preset.key && <Check size={14} />}
                    </button>
                  ))}
                </div>
                <span className="fs-field-hint">
                  Recolors highlights across the app. &ldquo;Signal Cyan&rdquo; is the default theme accent.
                </span>
              </div>

              <Toggle
                label="Ambient radar overlay"
                hint="Subtle grid + radar sweep behind the dashboard."
                checked={settings.radarOverlay}
                onChange={(v) => updateSettings({ radarOverlay: v })}
              />

              <Toggle
                label="Panel hover shimmer"
                hint="Soft light sweep across cards on hover."
                checked={settings.panelShimmer}
                onChange={(v) => updateSettings({ panelShimmer: v })}
              />
            </div>
          )}

          {tab === 'sources' && (
            <div className="fs-section">
              <div className="fs-field">
                <span className="fs-field-label">Add a custom source</span>
                <div className="fs-add-source">
                  <input
                    className="fs-input"
                    placeholder="Source name (optional)"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                  <input
                    className="fs-input"
                    placeholder="https://example.com/feed.xml"
                    value={url}
                    onChange={(e) => {
                      setUrl(e.target.value);
                      setError('');
                    }}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddSource()}
                  />
                  <div className="fs-add-row">
                    <select
                      className="fs-input fs-select"
                      value={category}
                      onChange={(e) => setCategory(e.target.value as Category)}
                    >
                      {CATEGORIES.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                    <button type="button" className="fs-add-btn" onClick={handleAddSource}>
                      <Plus size={15} />
                      Add
                    </button>
                  </div>
                  {error && <span className="fs-error">{error}</span>}
                </div>
              </div>

              <div className="fs-field">
                <span className="fs-field-label">Your sources</span>
                {settings.customSources.length === 0 ? (
                  <p className="fs-empty">
                    No custom sources yet. Paste any RSS/Atom link above to blend it into your global feed.
                  </p>
                ) : (
                  <ul className="fs-source-list">
                    {settings.customSources.map((s) => (
                      <li key={s.id} className="fs-source-item">
                        <div className="fs-source-info">
                          <span className="fs-source-name">{s.name}</span>
                          <span className="fs-source-url">{s.url}</span>
                        </div>
                        <button
                          type="button"
                          className="fs-source-remove"
                          onClick={() => removeCustomSource(s.id)}
                          aria-label={`Remove ${s.name}`}
                        >
                          <Trash2 size={15} />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="fs-footer">
          <button type="button" className="fs-reset-btn" onClick={resetSettings}>
            Reset to defaults
          </button>
          <button type="button" className="fs-done-btn" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
