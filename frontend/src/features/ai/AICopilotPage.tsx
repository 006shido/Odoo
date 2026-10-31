import { FormEvent, useEffect, useState } from 'react';
import { Activity, ArrowUp, Bot, Brain, CircleHelp, LoaderCircle, Sparkles, TrendingUp, UserRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSubscription } from '@/lib/store/subscriptionStore';
import { ApiError, api } from '@/lib/api';
import { cn } from '@/lib/utils';

type CopilotMode = 'billing_copilot' | 'renewal_insights' | 'customer_support';
type Turn = { role: 'user' | 'assistant'; content: string };
type CopilotResponse = { mode: CopilotMode; answer: string; as_of: string; currency: string };

const MODE_DETAILS: Record<CopilotMode, { label: string; description: string; prompts: string[]; icon: typeof Brain }> = {
  billing_copilot: {
    label: 'Billing copilot',
    description: 'Ask about collections, outstanding balances, invoice ageing, and subscription operations.',
    prompts: ['How much is overdue?', 'Summarize this month’s collections', 'What should our billing team follow up on?'],
    icon: Activity,
  },
  renewal_insights: {
    label: 'Renewal insights',
    description: 'Prioritize upcoming renewals using clear, rule-based account signals.',
    prompts: ['Which renewals need attention first?', 'Explain the high-risk renewals', 'What are the top follow-up actions?'],
    icon: TrendingUp,
  },
  customer_support: {
    label: 'Customer support',
    description: 'Get answers about your own subscriptions, invoices, and recent payments.',
    prompts: ['What is my next billing date?', 'Do I have any overdue invoices?', 'Show my recent payment activity'],
    icon: CircleHelp,
  },
};

export function AICopilotPage() {
  const { currentUser } = useSubscription();
  const isCustomer = currentUser.role === 'customer';
  const availableModes: CopilotMode[] = isCustomer
    ? ['customer_support']
    : ['billing_copilot', 'renewal_insights'];
  const [mode, setMode] = useState<CopilotMode>(isCustomer ? 'customer_support' : 'billing_copilot');
  const [turns, setTurns] = useState<Turn[]>([]);
  const [question, setQuestion] = useState('');
  const [error, setError] = useState('');
  const [asOf, setAsOf] = useState('');
  const [isSending, setIsSending] = useState(false);
  const details = MODE_DETAILS[mode];
  const ModeIcon = details.icon;

  useEffect(() => {
    setMode(isCustomer ? 'customer_support' : 'billing_copilot');
    setTurns([]);
    setError('');
  }, [isCustomer]);

  useEffect(() => {
    api.get('/auth/csrf/').catch(() => undefined);
  }, []);

  const sendQuestion = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isSending) return;
    const currentHistory = turns.slice(-6);
    setTurns((previous) => [...previous, { role: 'user', content: trimmed }]);
    setQuestion('');
    setError('');
    setIsSending(true);
    try {
      const result = await api.post<CopilotResponse>('/ai/copilot/', {
        mode,
        question: trimmed,
        history: currentHistory,
      });
      setTurns((previous) => [...previous, { role: 'assistant', content: result.answer }]);
      setAsOf(result.as_of);
    } catch (cause) {
      const apiMessage = cause instanceof ApiError && cause.data && typeof cause.data === 'object' && 'error' in cause.data
        ? String((cause.data as { error: unknown }).error)
        : 'The copilot could not answer right now. Please try again.';
      setError(apiMessage);
    } finally {
      setIsSending(false);
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void sendQuestion(question);
  };

  const selectMode = (nextMode: CopilotMode) => {
    if (nextMode === mode || isSending) return;
    setMode(nextMode);
    setTurns([]);
    setError('');
    setAsOf('');
  };

  return (
    <main className="mx-auto max-w-6xl space-y-6 pb-8 animate-in fade-in duration-300">
      <section className="relative overflow-hidden rounded-3xl bg-[#123d32] p-6 text-white sm:p-8">
        <div className="absolute -right-12 -top-20 h-64 w-64 rounded-full bg-emerald-300/15 blur-3xl" />
        <div className="relative flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/15 bg-white/10"><Sparkles className="h-6 w-6 text-emerald-200" /></div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-200">Brightloop AI</p>
            <h2 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">Your subscription copilot</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-emerald-50/75">Turn billing data into clear answers, helpful renewal follow-ups, and faster customer support.</p>
          </div>
        </div>
      </section>

      <div className="grid gap-5 lg:grid-cols-[250px_minmax(0,1fr)]">
        <aside className="space-y-2" aria-label="AI assistant modes">
          <p className="px-1 pb-1 text-xs font-semibold uppercase tracking-wider text-text-tertiary">Choose a copilot</p>
          {availableModes.map((item) => {
            const option = MODE_DETAILS[item];
            const Icon = option.icon;
            return (
              <button key={item} type="button" onClick={() => selectMode(item)} aria-pressed={mode === item} className={cn('w-full rounded-2xl border p-4 text-left transition', mode === item ? 'border-emerald-800/30 bg-emerald-50 text-emerald-950 shadow-xs' : 'border-border bg-surface text-text-secondary hover:bg-surface-secondary hover:text-text-primary')}>
                <span className="flex items-center gap-2 text-sm font-semibold"><Icon className="h-4 w-4" />{option.label}</span>
                <span className="mt-2 block text-xs leading-5 opacity-75">{option.description}</span>
              </button>
            );
          })}
          <div className="mt-4 rounded-2xl border border-border bg-surface p-4 text-xs leading-5 text-text-secondary">
            <span className="flex items-center gap-2 font-semibold text-text-primary"><Brain className="h-4 w-4 text-emerald-800" />Grounded in Brightloop data</span>
            <p className="mt-2">Balances, invoice totals, and renewal risk levels are prepared by Brightloop. AI explains the snapshot and does not change records.</p>
          </div>
        </aside>

        <section className="flex min-h-[620px] flex-col overflow-hidden rounded-3xl border border-border bg-surface shadow-xs" aria-label={details.label}>
          <header className="flex items-center justify-between gap-4 border-b border-border px-5 py-4 sm:px-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-800"><ModeIcon className="h-5 w-5" /></div>
              <div>
                <h3 className="text-sm font-semibold text-text-primary">{details.label}</h3>
                <p className="text-xs text-text-tertiary">{asOf ? `Data snapshot · ${asOf}` : 'Ask a question to get started'}</p>
              </div>
            </div>
            <span className="hidden items-center gap-1.5 rounded-full bg-surface-secondary px-2.5 py-1 text-[10px] font-medium text-text-secondary sm:inline-flex"><span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />Session-only chat</span>
          </header>

          <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-5 sm:p-6" aria-live="polite">
            {turns.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center py-8 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-800"><Bot className="h-7 w-7" /></div>
                <h4 className="mt-4 text-lg font-semibold text-text-primary">How can I help?</h4>
                <p className="mt-1 max-w-md text-sm leading-6 text-text-secondary">{details.description}</p>
                <div className="mt-6 flex max-w-2xl flex-wrap justify-center gap-2">
                  {details.prompts.map((prompt) => <button key={prompt} type="button" onClick={() => void sendQuestion(prompt)} disabled={isSending} className="rounded-full border border-border bg-surface px-3 py-2 text-xs text-text-secondary transition hover:border-emerald-800/40 hover:bg-emerald-50 hover:text-emerald-950 disabled:opacity-50">{prompt}</button>)}
                </div>
              </div>
            ) : turns.map((turn, index) => (
              <div key={`${turn.role}-${index}`} className={cn('flex items-start gap-3', turn.role === 'user' && 'flex-row-reverse')}>
                <div className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-full', turn.role === 'assistant' ? 'bg-emerald-50 text-emerald-800' : 'bg-surface-secondary text-text-secondary')}>
                  {turn.role === 'assistant' ? <Bot className="h-4 w-4" /> : <UserRound className="h-4 w-4" />}
                </div>
                <div className={cn('max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-6', turn.role === 'assistant' ? 'rounded-tl-sm bg-surface-secondary text-text-primary' : 'rounded-tr-sm bg-[#123d32] text-white')}>
                  <p className="whitespace-pre-wrap">{turn.content}</p>
                </div>
              </div>
            ))}
            {isSending && <div role="status" className="flex items-center gap-2 pl-11 text-xs text-text-secondary"><LoaderCircle className="h-4 w-4 animate-spin text-emerald-800" />Reviewing the latest Brightloop data…</div>}
            {error && <div role="alert" className="ml-11 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-800">{error}</div>}
          </div>

          <div className="border-t border-border p-4 sm:p-5">
            <form onSubmit={handleSubmit} className="flex items-end gap-2 rounded-2xl border border-border bg-surface-secondary/60 p-2 focus-within:border-emerald-800/40 focus-within:ring-2 focus-within:ring-emerald-800/10">
              <label htmlFor="copilot-question" className="sr-only">Ask {details.label}</label>
              <textarea id="copilot-question" rows={1} maxLength={1000} value={question} onChange={(event) => setQuestion(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); void sendQuestion(question); } }} placeholder="Ask about your Brightloop account…" className="max-h-32 min-h-10 flex-1 resize-y bg-transparent px-3 py-2 text-sm text-text-primary outline-none placeholder:text-text-tertiary" />
              <Button type="submit" disabled={!question.trim() || isSending} aria-label="Send question" className="h-10 w-10 shrink-0 rounded-xl bg-[#123d32] p-0 text-white hover:bg-[#1b5143]"><ArrowUp className="h-4 w-4" /></Button>
            </form>
            <p className="mt-2 text-center text-[10px] leading-4 text-text-tertiary">Your question, recent chat, and a limited account snapshot are sent to OpenAI to generate answers. Brightloop doesn’t save this chat. Verify important billing decisions in the source records.</p>
          </div>
        </section>
      </div>
    </main>
  );
}
