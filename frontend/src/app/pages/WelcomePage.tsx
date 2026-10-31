import { useNavigate } from 'react-router';
import {
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  Check,
  CreditCard,
  FileCheck2,
  Layers3,
  Repeat2,
  ShieldCheck,
  Sparkles,
  Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useSubscription } from '@/lib/store/subscriptionStore';
import { formatCurrency } from '@/lib/decimal';

const workflows = [
  { step: '01', title: 'Build your offer', detail: 'Choose a product and plan that fit your team.', icon: Layers3 },
  { step: '02', title: 'Approve the quote', detail: 'Review clear pricing and terms before you commit.', icon: FileCheck2 },
  { step: '03', title: 'Stay in control', detail: 'Manage renewals, invoices and payment history.', icon: Repeat2 },
];

const capabilities = [
  { title: 'Plans that make sense', detail: 'Compare monthly and yearly options, with inclusions and setup costs in the open.', icon: Sparkles },
  { title: 'Billing you can follow', detail: 'See what is due, what has been paid, and when the next renewal is scheduled.', icon: CreditCard },
  { title: 'Your account stays yours', detail: 'Your customer portal is focused on your own quotes, subscriptions and invoices.', icon: ShieldCheck },
];

export function WelcomePage() {
  const navigate = useNavigate();
  const { plans, settings } = useSubscription();
  const activePlans = plans.filter((plan) => plan.status === 'active').slice(0, 3);

  const openSignup = () => navigate('/login?mode=create');
  const openLogin = () => navigate('/login');

  return (
    <main className="min-h-dvh bg-background text-text-primary">
      <header className="sticky top-0 z-30 border-b border-border/80 bg-surface/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-8">
          <a href="/" className="flex items-center gap-2.5 font-semibold tracking-tight" aria-label="Brightloop home">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent text-accent-text"><Zap className="h-5 w-5 fill-current" /></span>
            <span className="text-lg">Brightloop</span>
          </a>
          <nav className="hidden items-center gap-7 text-sm text-text-secondary md:flex" aria-label="Main navigation">
            <a href="#how-it-works" className="transition hover:text-text-primary">How it works</a>
            <a href="#plans" className="transition hover:text-text-primary">Plans</a>
            <a href="#why-brightloop" className="transition hover:text-text-primary">Why Brightloop</a>
          </nav>
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={openLogin} className="rounded-xl px-3">Sign in</Button>
            <Button onClick={openSignup} className="rounded-xl bg-accent px-4 text-accent-text hover:bg-accent-hover">Create account <ArrowRight className="ml-1.5 h-4 w-4" /></Button>
          </div>
        </div>
      </header>

      <section className="relative isolate overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_right,var(--accent-light),transparent_42%)]" />
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 py-16 sm:px-8 sm:py-24 lg:grid-cols-[1.05fr_.95fr] lg:gap-16 lg:py-28">
          <div>
            <Badge variant="secondary" className="mb-5 rounded-full px-3 py-1.5 text-xs font-medium">
              <Sparkles className="mr-1.5 h-3.5 w-3.5 text-accent" /> Subscription management, made clear
            </Badge>
            <h1 className="max-w-2xl text-4xl font-semibold leading-[1.08] tracking-[-0.045em] sm:text-5xl lg:text-[62px]">
              Your business runs on subscriptions. <span className="text-accent">Run them well.</span>
            </h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-text-secondary sm:text-lg">
              Find the right plan, review your quote, and keep every renewal and invoice in one simple place.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button onClick={openSignup} size="lg" className="h-12 rounded-xl px-6 text-base">
                Explore plans <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button onClick={openLogin} variant="outline" size="lg" className="h-12 rounded-xl px-6 text-base">
                I already have an account
              </Button>
            </div>
            <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-xs text-text-secondary">
              <span className="inline-flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-success" /> No payment to request a quote</span>
              <span className="inline-flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-success" /> Clear renewal dates</span>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-[520px]">
            <div className="absolute -inset-6 -z-10 rounded-[36px] bg-accent/10 blur-2xl" />
            <div className="rounded-[26px] border border-border bg-surface p-5 shadow-lg sm:p-7">
              <div className="flex items-center justify-between border-b border-border pb-5">
                <div>
                  <p className="text-xs font-medium uppercase tracking-[0.12em] text-text-tertiary">Your subscription overview</p>
                  <h2 className="mt-1.5 text-xl font-semibold tracking-tight">Everything in rhythm</h2>
                </div>
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-accent-light text-accent"><Repeat2 className="h-5 w-5" /></span>
              </div>
              <div className="mt-5 rounded-2xl bg-surface-secondary p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs text-text-secondary">Next renewal</p>
                    <p className="mt-1 text-base font-semibold">Brightloop Core</p>
                  </div>
                  <Badge variant="success" className="rounded-full">On track</Badge>
                </div>
                <div className="mt-5 flex items-end justify-between">
                  <span className="text-2xl font-semibold">{formatCurrency('999.00', settings.currency_symbol)}<span className="ml-1 text-xs font-normal text-text-secondary">/ month</span></span>
                  <span className="text-xs text-text-secondary">Next bill · 01 Nov</span>
                </div>
                <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-border"><div className="h-full w-2/3 rounded-full bg-accent" /></div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-border p-4">
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-success-light text-success"><BadgeCheck className="h-4 w-4" /></span>
                  <p className="mt-3 text-sm font-medium">Invoice paid</p>
                  <p className="mt-0.5 text-xs text-text-secondary">Receipt ready to view</p>
                </div>
                <div className="rounded-2xl border border-border p-4">
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-info-light text-info"><FileCheck2 className="h-4 w-4" /></span>
                  <p className="mt-3 text-sm font-medium">Quote approved</p>
                  <p className="mt-0.5 text-xs text-text-secondary">Your team is all set</p>
                </div>
              </div>
              <p className="mt-4 text-center text-[10px] text-text-tertiary">Illustrative preview · your account shows your own billing details</p>
            </div>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="border-y border-border bg-surface">
        <div className="mx-auto max-w-7xl px-5 py-14 sm:px-8 sm:py-16">
          <div className="max-w-xl">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">A simpler subscription journey</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">From first quote to every renewal.</h2>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {workflows.map(({ step, title, detail, icon: Icon }) => (
              <article key={step} className="rounded-2xl border border-border bg-background p-5 sm:p-6">
                <div className="flex items-center justify-between"><span className="text-xs font-semibold text-text-tertiary">{step}</span><Icon className="h-5 w-5 text-accent" /></div>
                <h3 className="mt-5 text-base font-semibold">{title}</h3>
                <p className="mt-1.5 text-sm leading-6 text-text-secondary">{detail}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="plans" className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-20">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">Plans and pricing</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">A good place to get started.</h2>
            <p className="mt-2 text-sm text-text-secondary">Compare plans, then ask for a quotation tailored to your team.</p>
          </div>
          <Button variant="outline" onClick={openSignup} className="w-fit rounded-xl">See all plans <ArrowUpRight className="ml-1.5 h-4 w-4" /></Button>
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {activePlans.map((plan) => (
            <article key={plan.id} className="rounded-2xl border border-border bg-surface p-5 shadow-xs sm:p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-text-tertiary">{plan.product_name}</p>
              <h3 className="mt-2 text-lg font-semibold">{plan.name}</h3>
              <p className="mt-1 min-h-10 text-sm leading-5 text-text-secondary">{plan.description}</p>
              <p className="mt-5 border-t border-border pt-4 text-2xl font-semibold">{formatCurrency(plan.price, settings.currency_symbol)}<span className="ml-1 text-xs font-normal text-text-secondary">/ {plan.frequency}</span></p>
              <button onClick={openSignup} className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-accent hover:underline">View plan <ArrowRight className="h-3.5 w-3.5" /></button>
            </article>
          ))}
        </div>
        <p className="mt-4 text-[11px] text-text-tertiary">Plan preview may use demo workspace data. Confirm final pricing in your account quotation.</p>
      </section>

      <section id="why-brightloop" className="bg-[#123d32] text-white">
        <div className="mx-auto max-w-7xl px-5 py-14 sm:px-8 sm:py-16">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-300">Built around your account</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">Less chasing. More clarity.</h2>
            <p className="mt-3 text-sm leading-6 text-emerald-50/75">A clean view of the details that matter, with the right tools for every person involved.</p>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {capabilities.map(({ title, detail, icon: Icon }) => (
              <article key={title} className="rounded-2xl border border-white/10 bg-white/[0.05] p-5">
                <Icon className="h-5 w-5 text-emerald-300" />
                <h3 className="mt-4 text-sm font-semibold">{title}</h3>
                <p className="mt-1.5 text-sm leading-6 text-white/65">{detail}</p>
              </article>
            ))}
          </div>
          <div className="mt-8 flex flex-col items-start justify-between gap-4 border-t border-white/10 pt-7 sm:flex-row sm:items-center">
            <p className="text-sm text-white/70">Ready to make subscription management easier?</p>
            <Button onClick={openSignup} className="rounded-xl bg-emerald-300 text-[#123d32] hover:bg-emerald-200">Create your account <ArrowRight className="ml-2 h-4 w-4" /></Button>
          </div>
        </div>
      </section>

      <footer className="bg-surface">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-5 py-6 text-xs text-text-tertiary sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <span className="font-medium text-text-secondary">Brightloop</span>
          <span>Subscription operations and recurring billing.</span>
          <button onClick={openLogin} className="w-fit hover:text-text-primary">Team sign in</button>
        </div>
      </footer>
    </main>
  );
}
