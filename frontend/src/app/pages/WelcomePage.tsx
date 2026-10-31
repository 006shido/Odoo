import {
  ArrowRight,
  Layers,
  Shield,
  Zap,
  BarChart3,
  Users,
  FileText,
  CreditCard,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { StatusBadge } from '@/components/shared/status-badge';

const features = [
  {
    icon: Users,
    title: 'Customer Management',
    description: 'Maintain customer profiles, contacts, and billing details with full audit trail.',
  },
  {
    icon: Layers,
    title: 'Product Catalogue',
    description: 'Products, variants, and subscription plans with flexible pricing.',
  },
  {
    icon: FileText,
    title: 'Quotations & Invoices',
    description: 'Professional documents with PDF generation and lifecycle tracking.',
  },
  {
    icon: CreditCard,
    title: 'Payment Allocation',
    description: 'Record and allocate payments with full and partial support.',
  },
  {
    icon: BarChart3,
    title: 'Reports & Analytics',
    description: 'Subscription metrics, invoice ageing, and revenue insights.',
  },
  {
    icon: Shield,
    title: 'Control Tower',
    description: 'Operational dashboard for renewals, overdue accounts, and billing health.',
  },
];

export function WelcomePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-surface">
        <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent">
              <Zap className="h-5 w-5 text-accent-text" />
            </div>
            <span className="text-lg font-semibold tracking-tight">Brightloop</span>
          </div>
          <Button variant="outline" size="sm">
            Sign In <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
          </Button>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="max-w-2xl">
          <Badge variant="secondary" className="mb-4">
            Subscription Management System
          </Badge>
          <h1 className="text-4xl font-bold tracking-tight text-text-primary sm:text-5xl">
            Clear operations.
            <br />
            Dependable billing.
          </h1>
          <p className="mt-4 text-lg text-text-secondary leading-relaxed max-w-xl">
            Centralize your subscription lifecycle from quotation to payment.
            One workspace, full control.
          </p>
          <div className="mt-8 flex items-center gap-3">
            <Button size="lg">
              Get Started <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button variant="outline" size="lg">
              View Documentation
            </Button>
          </div>
        </div>
      </section>

      <Separator className="mx-auto max-w-6xl" />

      {/* Features */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <h2 className="text-2xl font-semibold tracking-tight text-text-primary mb-2">
          Everything you need
        </h2>
        <p className="text-text-secondary mb-10">
          A complete subscription operations platform, built for clarity and precision.
        </p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <Card key={feature.title} className="border-border/60 shadow-xs hover:shadow-sm transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-md bg-accent-light">
                    <feature.icon className="h-4.5 w-4.5 text-accent" />
                  </div>
                  <CardTitle className="text-base">{feature.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-text-secondary leading-relaxed">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <Separator className="mx-auto max-w-6xl" />

      {/* Design System Preview */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <h2 className="text-2xl font-semibold tracking-tight text-text-primary mb-2">
          Design System Preview
        </h2>
        <p className="text-text-secondary mb-10">
          Component primitives and design tokens — visual verification.
        </p>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Buttons */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Buttons</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-3">
              <Button>Primary</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="destructive">Destructive</Button>
              <Button variant="link">Link</Button>
              <Button size="sm">Small</Button>
              <Button size="lg">Large</Button>
              <Button disabled>Disabled</Button>
            </CardContent>
          </Card>

          {/* Badges */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Status Badges</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              <StatusBadge status="active" />
              <StatusBadge status="paused" />
              <StatusBadge status="draft" />
              <StatusBadge status="expired" />
              <StatusBadge status="closed" />
              <StatusBadge status="sent" />
              <StatusBadge status="accepted" />
              <StatusBadge status="rejected" />
              <StatusBadge status="issued" />
              <StatusBadge status="paid" />
              <StatusBadge status="partially_paid" />
              <StatusBadge status="overdue" />
              <StatusBadge status="void" />
            </CardContent>
          </Card>

          {/* Skeleton Loading */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Loading Skeleton</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-10 w-full" />
              <div className="flex gap-3">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-3 w-2/3" />
                  <Skeleton className="h-3 w-1/3" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Typography */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Typography</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-2xl font-semibold tracking-tight">Heading 2xl</p>
              <p className="text-xl font-semibold">Heading xl</p>
              <p className="text-lg font-medium">Heading lg</p>
              <p className="text-base text-text-primary">Body base</p>
              <p className="text-sm text-text-secondary">Body small / secondary</p>
              <p className="text-xs text-text-tertiary">Caption / tertiary</p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-surface mt-8">
        <div className="mx-auto max-w-6xl px-6 py-6 text-center">
          <p className="text-xs text-text-tertiary">
            Brightloop — Software Subscription Management System
          </p>
        </div>
      </footer>
    </div>
  );
}

