'use client';

import { useMemo, useRef, useEffect, useState } from 'react';
import { Bot, Send, Sparkles, X } from 'lucide-react';

const SUGGESTIONS = [
  'Summarize today\'s top AI headlines',
  'What crypto news matters most right now?',
  'Explain the biggest market-moving story',
];

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface AIAssistantPanelProps {
  open: boolean;
  onClose: () => void;
}

export function AIAssistantPanel({ open, onClose }: AIAssistantPanelProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'groq' | 'offline' | null>(null);
  const chatRef = useRef<HTMLDivElement>(null);

  const hasMessages = messages.length > 0;
  const wireMessages = useMemo(
    () => messages.map((m) => ({ role: m.role, content: m.content })),
    [messages],
  );

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const send = async (text: string) => {
    const query = text.trim();
    if (!query || loading) return;

    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: query }]);
    setLoading(true);

    try {
      const outgoing = [...wireMessages, { role: 'user' as const, content: query }];
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: outgoing }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Request failed');
      setMode(data.mode ?? null);
      setMessages((prev) => [...prev, { role: 'assistant', content: data.content }]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Something went wrong';
      setMessages((prev) => [...prev, { role: 'assistant', content: msg }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div
        className={`ai-assistant-overlay ${open ? 'open' : ''}`}
        onClick={onClose}
        aria-hidden={!open}
      />
      <aside className={`ai-assistant-panel ${open ? 'open' : ''}`} aria-hidden={!open}>
        <div className="ai-panel-header">
          <div className="ai-title">
            <span className="ai-title-icon" aria-hidden="true">
              <Bot size={18} />
            </span>
            <div className="ai-title-text">
              <h3>AI Assistant</h3>
              <span className={`ai-mode${mode === 'offline' ? ' is-offline' : ''}`}>
                {mode === 'offline' ? 'Offline analyst' : 'Live analyst'}
              </span>
            </div>
          </div>
          <button type="button" className="ai-panel-close" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <div className="ai-chat-area" ref={chatRef}>
          {!hasMessages && (
            <div className="ai-suggestions">
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: 8 }}>
                Ask about news, markets, or technology trends.
              </p>
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  className="ai-suggestion-btn"
                  onClick={() => send(s)}
                >
                  <Sparkles size={14} style={{ marginRight: 8 }} />
                  {s}
                </button>
              ))}
              <div className="ai-setup-hint">
                If you see “GROQ_API_KEY is not set”, add it to your `.env.local` and restart the dev server.
              </div>
            </div>
          )}
          {messages.map((m, i) => (
            <div key={i} className={`chat-message ${m.role} chat-anim-in`}>
              {m.content}
            </div>
          ))}
          {loading && (
            <div className="chat-message assistant chat-anim-in" aria-label="Assistant is thinking">
              <span className="typing-indicator" aria-hidden="true">
                <span className="typing-dot" />
                <span className="typing-dot" />
                <span className="typing-dot" />
              </span>
            </div>
          )}
        </div>

        <div className="ai-input-area">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && send(input)}
            placeholder="Ask me anything about the news…"
            disabled={loading}
          />
          <button
            type="button"
            className="ai-send-btn"
            onClick={() => send(input)}
            disabled={loading || !input.trim()}
            aria-label="Send"
          >
            <Send size={16} />
          </button>
        </div>
      </aside>
    </>
  );
}
