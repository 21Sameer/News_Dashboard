'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { Category } from '@/types';
import { FeedSettingsModal } from '@/components/ui/feed-settings-modal';

export interface CustomSource {
  id: string;
  name: string;
  url: string;
  category: Category;
}

export interface AppSettings {
  refreshInterval: number; // milliseconds, 0 = manual
  accent: string; // key from ACCENT_PRESETS
  radarOverlay: boolean;
  panelShimmer: boolean;
  customSources: CustomSource[];
}

export const ACCENT_PRESETS: { key: string; label: string; color: string }[] = [
  { key: 'default', label: 'Signal Cyan', color: '#0ea5e9' },
  { key: 'violet', label: 'Violet', color: '#8b5cf6' },
  { key: 'blue', label: 'Royal Blue', color: '#3b82f6' },
  { key: 'emerald', label: 'Emerald', color: '#10b981' },
  { key: 'rose', label: 'Rose', color: '#f43f5e' },
  { key: 'amber', label: 'Amber', color: '#f59e0b' },
  { key: 'orange', label: 'Sunset', color: '#f97316' },
  { key: 'fuchsia', label: 'Fuchsia', color: '#d946ef' },
];

export const REFRESH_OPTIONS: { label: string; value: number }[] = [
  { label: '30s', value: 30 * 1000 },
  { label: '1m', value: 60 * 1000 },
  { label: '5m', value: 5 * 60 * 1000 },
  { label: 'Manual', value: 0 },
];

const STORAGE_KEY = 'newsdash_settings_v1';

const DEFAULT_SETTINGS: AppSettings = {
  refreshInterval: 60 * 1000,
  accent: 'default',
  radarOverlay: true,
  panelShimmer: true,
  customSources: [],
};

interface SettingsContextValue {
  settings: AppSettings;
  updateSettings: (patch: Partial<AppSettings>) => void;
  addCustomSource: (source: Omit<CustomSource, 'id'>) => void;
  removeCustomSource: (id: string) => void;
  resetSettings: () => void;
  openSettings: () => void;
  closeSettings: () => void;
  isOpen: boolean;
  mounted: boolean;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

function applyAccent(accentKey: string) {
  const root = document.documentElement;
  const preset = ACCENT_PRESETS.find((p) => p.key === accentKey);

  if (!preset || accentKey === 'default') {
    root.style.removeProperty('--accent-blue');
    root.style.removeProperty('--accent-cyan');
    root.style.removeProperty('--accent-indigo');
    return;
  }

  root.style.setProperty('--accent-blue', preset.color);
  root.style.setProperty('--accent-cyan', preset.color);
  root.style.setProperty('--accent-indigo', preset.color);
}

function applyBodyFlags(settings: AppSettings) {
  const body = document.body;
  body.classList.toggle('radar-overlay-on', settings.radarOverlay);
  body.classList.toggle('panel-shimmer-on', settings.panelShimmer);
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        setSettings({ ...DEFAULT_SETTINGS, ...parsed });
      }
    } catch {
      // ignore malformed storage
    }
  }, []);

  useEffect(() => {
    if (!mounted) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch {
      // ignore quota errors
    }
    applyAccent(settings.accent);
    applyBodyFlags(settings);
  }, [settings, mounted]);

  const updateSettings = useCallback((patch: Partial<AppSettings>) => {
    setSettings((prev) => ({ ...prev, ...patch }));
  }, []);

  const addCustomSource = useCallback((source: Omit<CustomSource, 'id'>) => {
    setSettings((prev) => {
      const url = source.url.trim();
      if (!url || prev.customSources.some((s) => s.url === url)) return prev;
      const id = `custom-${Date.now().toString(36)}`;
      return { ...prev, customSources: [...prev.customSources, { ...source, url, id }] };
    });
  }, []);

  const removeCustomSource = useCallback((id: string) => {
    setSettings((prev) => ({
      ...prev,
      customSources: prev.customSources.filter((s) => s.id !== id),
    }));
  }, []);

  const resetSettings = useCallback(() => setSettings(DEFAULT_SETTINGS), []);
  const openSettings = useCallback(() => setIsOpen(true), []);
  const closeSettings = useCallback(() => setIsOpen(false), []);

  const value = useMemo(
    () => ({
      settings,
      updateSettings,
      addCustomSource,
      removeCustomSource,
      resetSettings,
      openSettings,
      closeSettings,
      isOpen,
      mounted,
    }),
    [settings, updateSettings, addCustomSource, removeCustomSource, resetSettings, openSettings, closeSettings, isOpen, mounted],
  );

  return (
    <SettingsContext.Provider value={value}>
      {children}
      <FeedSettingsModal open={isOpen} onClose={closeSettings} />
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) {
    throw new Error('useSettings must be used within SettingsProvider');
  }
  return ctx;
}
