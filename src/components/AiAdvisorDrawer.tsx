import React, { useEffect, useRef, useState } from 'react';
import { ArrowRight, Send, Sparkles, X } from 'lucide-react';
import { apiFetch } from '../lib/apiClient';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface AiAdvisorDrawerProps {
  open: boolean;
  onClose: () => void;
  onProceedToConsult: (summaryText: string) => void;
}

const STARTER_PROMPTS = [
  'How can Pio help standardize our startup customer support & escalation workflow?',
  'We need weekly SLA and executive analytics dashboards from messy spreadsheets.',
  'What does an SMB web creation + account operations engagement look like?',
];

export const AiAdvisorDrawer: React.FC<AiAdvisorDrawerProps> = ({
  open,
  onClose,
  onProceedToConsult,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content:
        'Welcome. I can help map your goals across technical support, customer service, data analytics, administrative operations, account management, or web creation. What operational priority are you focusing on?',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (open) {
      endRef.current?.scrollIntoView({ behavior: 'smooth' });
      inputRef.current?.focus();
    }
  }, [messages, open]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  const sendMessage = async (textToSend: string) => {
    const trimmed = textToSend.trim();
    if (!trimmed || loading) return;

    const nextMessages: ChatMessage[] = [
      ...messages,
      { role: 'user', content: trimmed },
    ];
    setMessages(nextMessages);
    setInput('');
    setError(null);
    setLoading(true);

    try {
      const data = await apiFetch<{ reply: string }>('/api/assistant', {
        method: 'POST',
        body: JSON.stringify({ messages: nextMessages }),
      });
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: data.reply },
      ]);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Unable to connect to the service advisor.'
      );
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  const lastUserMessage = [...messages].reverse().find((m) => m.role === 'user')?.content || '';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="ai-advisor-title"
      className="fixed inset-0 z-50 flex justify-end bg-black/65 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="flex h-full w-full max-w-md flex-col border-l border-[#E5CE93]/20 bg-[#071B20] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[#E5CE93]/15 px-5 py-4">
          <div className="flex items-center gap-2.5">
            <Sparkles className="h-4 w-4 text-[#C8A253]" aria-hidden="true" />
            <div>
              <h2
                id="ai-advisor-title"
                className="font-display text-base font-semibold text-[#F5F2EB]"
              >
                Service Guidance Advisor
              </h2>
              <p className="text-xs text-[#F5F2EB]/60">Powered by Gemini</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close Service Advisor"
            className="rounded-lg border border-[#E5CE93]/20 p-2 text-[#F5F2EB] hover:bg-[#0D2B32]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto p-5" aria-live="polite">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`rounded-xl px-4 py-3 text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'ml-6 border border-[#C8A253]/30 bg-[#144B54]/70 text-[#F5F2EB]'
                  : 'mr-4 border border-[#E5CE93]/15 bg-[#0D2B32] text-[#F5F2EB]/90'
              }`}
            >
              <p className="mb-1 text-[11px] font-medium text-[#E5CE93]">
                {msg.role === 'user' ? 'You' : 'PL Service Advisor'}
              </p>
              <p className="whitespace-pre-line">{msg.content}</p>
            </div>
          ))}

          {loading && (
            <div className="mr-4 rounded-xl border border-[#E5CE93]/15 bg-[#0D2B32] px-4 py-3 text-xs text-[#E5CE93]">
              Evaluating service alignment...
            </div>
          )}

          {error && (
            <div
              role="alert"
              className="rounded-xl border border-amber-400/35 bg-amber-950/40 px-4 py-3 text-xs text-amber-200"
            >
              {error}
            </div>
          )}

          {messages.length === 1 && (
            <div className="space-y-2 pt-2">
              <p className="text-xs text-[#F5F2EB]/55">Suggested questions:</p>
              {STARTER_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => sendMessage(prompt)}
                  className="block w-full rounded-lg border border-[#E5CE93]/15 bg-[#0D2B32]/70 px-3.5 py-2.5 text-left text-xs text-[#F5F2EB]/80 transition-colors hover:border-[#C8A253] hover:text-[#E5CE93]"
                >
                  {prompt}
                </button>
              ))}
            </div>
          )}
          <div ref={endRef} />
        </div>

        <div className="border-t border-[#E5CE93]/15 bg-[#0A242B] p-4 space-y-3">
          {lastUserMessage && (
            <button
              type="button"
              onClick={() => {
                onProceedToConsult(lastUserMessage);
                onClose();
              }}
              className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-[#C8A253]/40 bg-[#0D2B32] px-3 py-2 text-xs font-semibold text-[#E5CE93] hover:bg-[#144B54]"
            >
              <span>Carry Context Into Consultation Form</span>
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendMessage(input);
            }}
            className="flex items-center gap-2"
          >
            <input
              ref={inputRef}
              type="text"
              aria-label="Ask Service Guidance Advisor"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about services, timelines, or operations..."
              className="min-h-[42px] flex-1 rounded-lg border border-[#E5CE93]/20 bg-[#071B20] px-3.5 py-2 text-sm text-[#F5F2EB] placeholder:text-[#F5F2EB]/40 focus:border-[#C8A253] focus:outline-none"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              aria-label="Send message"
              className="inline-flex min-h-[42px] min-w-[42px] items-center justify-center rounded-lg bg-[#C8A253] text-[#071B20] transition-colors hover:bg-[#E5CE93] disabled:opacity-50"
            >
              <Send className="h-4 w-4" aria-hidden="true" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
