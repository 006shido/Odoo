import { useState, type FormEvent, type ReactNode } from 'react';
import { useNavigate } from 'react-router';
import {
  ArrowRight,
  BadgeCheck,
  Check,
  CircleHelp,
  CreditCard,
  Layers3,
  LoaderCircle,
  LockKeyhole,
  Mail,
  ShieldCheck,
  Sparkles,
  UserRound,
  UsersRound,
  Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useSubscription } from '@/lib/store/subscriptionStore';
import { api } from '@/lib/api';
import type { AuthUser, UserRole } from '@/types';

type AuthMode = 'signin' | 'create' | 'reset';

const demoAccounts: Array<{
  role: UserRole;
  label: string;
  description: string;
  email: string;
  icon: typeof ShieldCheck;
}> = [
  { role: 'admin', label: 'Admin', description: 'Configure the workspace', email: 'admin@brightloop.io', icon: ShieldCheck },
  { role: 'staff', label: 'Staff', description: 'Run daily operations', email: 'staff@brightloop.io', icon: UsersRound },
  { role: 'customer', label: 'Customer', description: 'Explore plans and subscriptions', email: 'alex@acmecorp.com', icon: UserRound },
];

export function LoginPage() {
  const navigate = useNavigate();
  const { setCurrentUser } = useSubscription();
  const [mode, setMode] = useState<AuthMode>(() =>
    new URLSearchParams(window.location.search).get('mode') === 'create' ? 'create' : 'signin',
  );
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [company, setCompany] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);

  const startSession = (user?: AuthUser) => {
    if (user) setCurrentUser(user);
    localStorage.setItem('brightloop_session', 'active');
    navigate(user?.role === 'customer' ? '/plans' : '/dashboard', { replace: true });
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setNotice('');
    if (mode === 'create' && (
      password.length <= 8 ||
      !/[A-Z]/.test(password) ||
      !/[a-z]/.test(password) ||
      !/[^A-Za-z0-9]/.test(password)
    )) {
      setError('Use more than 8 characters, with uppercase and lowercase letters and a special character.');
      return;
    }
    setBusy(true);

    try {
      if (mode === 'signin') {
        const result = await api.post<{ user: AuthUser }>('/auth/login/', { email, password });
        const session = await api.get<{ customer_id?: string }>('/auth/me/');
        startSession({ ...result.user, customer_id: session.customer_id });
      } else if (mode === 'create') {
        const result = await api.post<{ user: AuthUser }>('/auth/register/', {
          email,
          password,
          first_name: firstName,
          last_name: lastName,
          company_name: company,
        });
        const session = await api.get<{ customer_id?: string }>('/auth/me/');
        startSession({ ...result.user, customer_id: session.customer_id });
      } else {
        const result = await api.post<{ message: string }>('/auth/forgot-password/', { email });
        setNotice(result.message || 'If an account exists, a reset link is on its way.');
      }
    } catch (requestError) {
      const data = (requestError as { data?: Record<string, unknown> })?.data;
      const detail = data?.error || data?.email || data?.password || data?.detail;
      setError(Array.isArray(detail) ? String(detail[0]) : typeof detail === 'string' ? detail : 'Could not connect. Please check your details and try again.');
    } finally {
      setBusy(false);
    }
  };

  const enterDemo = async (role: UserRole) => {
    const demoEmail = demoAccounts.find((account) => account.role === role)?.email;
    if (!demoEmail) return;
    setError('');
    setBusy(true);
    try {
      await api.get('/auth/csrf/');
      const result = await api.post<{ user: AuthUser }>('/auth/login/', {
        email: demoEmail,
        password: 'Brightloop@2026',
      });
      const session = await api.get<{ customer_id?: string }>('/auth/me/');
      startSession({ ...result.user, customer_id: session.customer_id });
    } catch {
      setError('Demo sign-in needs the backend demo accounts. Start Django and run `python manage.py seed_demo_data`, then try again.');
    } finally {
      setBusy(false);
    }
  };

  const passwordRules = mode === 'create' ? [
    { label: 'More than 8 characters', valid: password.length > 8 },
    { label: 'Uppercase and lowercase letters', valid: /[A-Z]/.test(password) && /[a-z]/.test(password) },
    { label: 'A special character', valid: /[^A-Za-z0-9]/.test(password) },
  ] : [];

  return (
    <main className="min-h-dvh bg-[#f7f8fa] text-[#17211d] selection:bg-emerald-100">
      <div className="mx-auto grid min-h-dvh max-w-[1440px] lg:grid-cols-[1.05fr_.95fr]">
        <section className="relative hidden overflow-hidden bg-[#102a24] px-12 py-10 text-white lg:flex lg:flex-col xl:px-20">
          <div className="absolute -right-32 top-16 h-96 w-96 rounded-full bg-emerald-400/20 blur-[100px]" />
          <div className="absolute -bottom-40 -left-20 h-[480px] w-[480px] rounded-full bg-teal-300/10 blur-[110px]" />
          <a href="/login" className="relative flex w-fit items-center gap-2.5 text-lg font-semibold tracking-tight">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-300 text-[#102a24]"><Zap className="h-5 w-5 fill-current" /></span>
            Brightloop
          </a>

          <div className="relative my-auto max-w-xl py-20">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-medium text-emerald-100">
              <Sparkles className="h-3.5 w-3.5" /> Subscription operations, made clear
            </div>
            <h1 className="text-5xl font-semibold leading-[1.08] tracking-[-0.04em] xl:text-[62px]">
              Every renewal.<br />Every invoice.<br /><span className="text-emerald-300">In rhythm.</span>
            </h1>
            <p className="mt-6 max-w-md text-base leading-7 text-emerald-50/70">
              One calm workspace for customer plans, recurring billing, and the money that keeps your business moving.
            </p>

            <div className="mt-12 grid max-w-lg grid-cols-3 gap-3">
              {[
                { icon: Layers3, title: 'Plans', detail: 'One catalogue' },
                { icon: CreditCard, title: 'Billing', detail: 'On schedule' },
                { icon: BadgeCheck, title: 'Clarity', detail: 'At a glance' },
              ].map(({ icon: Icon, title, detail }) => (
                <div key={title} className="rounded-2xl border border-white/10 bg-white/[0.06] p-4 backdrop-blur-sm">
                  <Icon className="mb-5 h-4 w-4 text-emerald-300" />
                  <p className="text-sm font-medium">{title}</p>
                  <p className="mt-1 text-xs text-white/50">{detail}</p>
                </div>
              ))}
            </div>
          </div>
          <p className="relative text-xs text-white/40">Brightloop · Subscription management</p>
        </section>

        <section className="flex min-h-dvh flex-col px-5 py-6 sm:px-10 lg:px-14 xl:px-20">
          <div className="flex items-center justify-between lg:justify-end">
            <a href="/login" className="flex items-center gap-2 text-base font-semibold lg:hidden"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#123d32] text-emerald-300"><Zap className="h-4 w-4 fill-current" /></span>Brightloop</a>
            <a href="mailto:support@brightloop.io" className="inline-flex items-center gap-1.5 text-xs text-[#737d78] transition hover:text-[#17211d]"><CircleHelp className="h-3.5 w-3.5" /> Help</a>
          </div>

          <div className="mx-auto flex w-full max-w-[440px] flex-1 flex-col justify-center py-10">
            <div className="mb-8">
              <p className="mb-2 text-sm font-medium text-emerald-700">Welcome to Brightloop</p>
              <h2 className="text-3xl font-semibold tracking-[-0.035em]">{mode === 'signin' ? 'Sign in to continue' : mode === 'create' ? 'Create your account' : 'Reset your password'}</h2>
              <p className="mt-2 text-sm leading-6 text-[#737d78]">{mode === 'signin' ? 'Pick up right where your subscriptions need you.' : mode === 'create' ? 'Start managing your subscriptions in one place.' : 'We’ll email you a link to get back into your account.'}</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'create' && <div className="grid grid-cols-2 gap-3">
                <Field label="First name"><Input autoComplete="given-name" value={firstName} onChange={(event) => setFirstName(event.target.value)} required placeholder="Alex" className="h-11 rounded-xl border-[#e4e8e5] bg-white" /></Field>
                <Field label="Last name"><Input autoComplete="family-name" value={lastName} onChange={(event) => setLastName(event.target.value)} required placeholder="Rivera" className="h-11 rounded-xl border-[#e4e8e5] bg-white" /></Field>
              </div>}
              {mode === 'create' && <Field label="Company"><Input autoComplete="organization" value={company} onChange={(event) => setCompany(event.target.value)} placeholder="Your company" className="h-11 rounded-xl border-[#e4e8e5] bg-white" /></Field>}
              <Field label="Work email"><div className="relative"><Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9aa39e]" /><Input type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required placeholder="you@company.com" className="h-11 rounded-xl border-[#e4e8e5] bg-white pl-10" /></div></Field>
              {mode !== 'reset' && <Field label="Password"><div className="relative"><LockKeyhole className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9aa39e]" /><Input type="password" autoComplete={mode === 'create' ? 'new-password' : 'current-password'} value={password} onChange={(event) => setPassword(event.target.value)} required className="h-11 rounded-xl border-[#e4e8e5] bg-white pl-10" placeholder={mode === 'create' ? 'Create a strong password' : 'Enter your password'} /></div></Field>}

              {mode === 'create' && <div className="grid gap-1.5 rounded-xl bg-white/70 p-3 text-xs text-[#737d78]">{passwordRules.map((rule) => <p key={rule.label} className="flex items-center gap-2"><Check className={`h-3.5 w-3.5 ${rule.valid ? 'text-emerald-600' : 'text-[#b5bdb8]'}`} />{rule.label}</p>)}</div>}
              {error && <p role="alert" className="rounded-xl border border-red-100 bg-red-50 px-3.5 py-3 text-sm text-red-700">{error}</p>}
              {notice && <p role="status" className="rounded-xl border border-emerald-100 bg-emerald-50 px-3.5 py-3 text-sm text-emerald-800">{notice}</p>}

              <Button type="submit" disabled={busy} className="h-11 w-full rounded-xl bg-[#123d32] text-white shadow-sm transition hover:bg-[#1b5143]">
                {busy ? <><LoaderCircle className="mr-2 h-4 w-4 animate-spin" />Please wait…</> : <>{mode === 'signin' ? 'Sign in' : mode === 'create' ? 'Create account' : 'Send reset link'}<ArrowRight className="ml-2 h-4 w-4" /></>}
              </Button>
            </form>

            <div className="mt-4 flex items-center justify-between text-xs">
              {mode === 'signin' ? <button type="button" onClick={() => { setMode('reset'); setError(''); setNotice(''); }} className="font-medium text-emerald-800 hover:underline">Forgot password?</button> : <button type="button" onClick={() => { setMode('signin'); setError(''); setNotice(''); }} className="font-medium text-emerald-800 hover:underline">Back to sign in</button>}
              {mode === 'signin' && <button type="button" onClick={() => { setMode('create'); setError(''); setNotice(''); }} className="font-medium text-[#737d78] hover:text-[#17211d]">New customer? <span className="text-emerald-800">Create account</span></button>}
            </div>

            <div className="my-8 flex items-center gap-3 text-[11px] font-medium uppercase tracking-[0.12em] text-[#a1aaa5]"><span className="h-px flex-1 bg-[#e4e8e5]" />Hackathon demo access<span className="h-px flex-1 bg-[#e4e8e5]" /></div>
            <div className="space-y-2">
              {demoAccounts.map(({ role, label, description, email: demoEmail, icon: Icon }) => (
                <button key={role} type="button" disabled={busy} onClick={() => void enterDemo(role)} className="group flex w-full items-center gap-3 rounded-2xl border border-[#e4e8e5] bg-white px-3.5 py-3 text-left transition hover:border-emerald-200 hover:bg-emerald-50/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 disabled:cursor-wait disabled:opacity-60">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#f2f6f3] text-emerald-800 group-hover:bg-emerald-100"><Icon className="h-4 w-4" /></span>
                  <span className="min-w-0 flex-1"><span className="block text-sm font-semibold">Continue as {label}</span><span className="block truncate text-xs text-[#858f89]">{description} · {demoEmail}</span></span>
                  <ArrowRight className="h-4 w-4 text-[#a1aaa5] transition group-hover:translate-x-0.5 group-hover:text-emerald-800" />
                </button>
              ))}
            </div>
            <p className="mt-3 text-center text-[11px] text-[#9aa39e]">Demo access uses sample workspace data.</p>
          </div>
          <div className="mx-auto flex w-full max-w-[440px] justify-between border-t border-[#e4e8e5] pt-4 text-[11px] text-[#9aa39e]"><span>© 2026 Brightloop</span><span className="inline-flex items-center gap-1"><LockKeyhole className="h-3 w-3" />Secure access</span></div>
        </section>
      </div>
    </main>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return <label className="block space-y-1.5"><span className="text-xs font-semibold text-[#39443e]">{label}</span>{children}</label>;
}
