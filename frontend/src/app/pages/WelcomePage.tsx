import * as React from 'react';
import {
  ArrowRight,
  Layers,
  Shield,
  Zap,
  BarChart3,
  Users,
  FileText,
  CreditCard,
  MoreVertical,
  Trash2,
  Edit,
  Copy,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { StatusBadge } from '@/components/shared/status-badge';
import { ConfirmationDialog } from '@/components/shared/confirmation-dialog';

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
  const [confirmedAction, setConfirmedAction] = React.useState<string | null>(null);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent">
              <Zap className="h-5 w-5 text-accent-text" />
            </div>
            <div>
              <span className="text-lg font-semibold tracking-tight text-text-primary">
                Brightloop
              </span>
              <span className="ml-2 rounded bg-surface-secondary px-1.5 py-0.5 text-xs text-text-secondary">
                Foundation v1.0
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  Quick Actions <MoreVertical className="ml-1 h-3.5 w-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel>Workspace</DropdownMenuLabel>
                <DropdownMenuItem>
                  <Edit className="mr-2 h-4 w-4" /> Edit Profile
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Copy className="mr-2 h-4 w-4" /> Copy API URL
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem destructive>
                  <Trash2 className="mr-2 h-4 w-4" /> Reset Demo State
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button size="sm">
              Sign In <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="max-w-2xl">
          <Badge variant="secondary" className="mb-4">
            Subscription Management System
          </Badge>
          <h1 className="text-4xl font-bold tracking-tight text-text-primary sm:text-5xl">
            Clear operations.
            <br />
            Dependable billing.
          </h1>
          <p className="mt-4 text-lg leading-relaxed text-text-secondary max-w-xl">
            Centralize your subscription lifecycle from quotation to payment.
            One workspace, full control, and premium Apple-inspired restraint.
          </p>
          <div className="mt-8 flex items-center gap-3">
            <Button size="lg">
              Get Started <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <ConfirmationDialog
              trigger={
                <Button variant="outline" size="lg">
                  Test Confirm Dialog
                </Button>
              }
              title="Confirm Action"
              description="This demonstrates the unified confirmation dialog component for irreversible state transitions."
              confirmLabel="Proceed"
              onConfirm={() => setConfirmedAction('Action confirmed successfully!')}
            />
          </div>
          {confirmedAction && (
            <p className="mt-3 text-sm font-medium text-success">{confirmedAction}</p>
          )}
        </div>
      </section>

      <Separator className="mx-auto max-w-6xl" />

      {/* Features */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <h2 className="text-2xl font-semibold tracking-tight text-text-primary mb-2">
          Platform Architecture
        </h2>
        <p className="text-text-secondary mb-10">
          A complete subscription operations platform, built for clarity, consistency, and precision.
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

      {/* Design System Preview Section */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="mb-8">
          <h2 className="text-2xl font-semibold tracking-tight text-text-primary">
            Design System & Component Foundation
          </h2>
          <p className="text-text-secondary mt-1">
            Complete suite of accessible UI primitives and shared components following Apple-inspired restraint.
          </p>
        </div>

        <Tabs defaultValue="primitives" className="w-full">
          <TabsList className="mb-8">
            <TabsTrigger value="primitives">Buttons & Forms</TabsTrigger>
            <TabsTrigger value="status">Status & Badges</TabsTrigger>
            <TabsTrigger value="navigation">Navigation & Skeletons</TabsTrigger>
          </TabsList>

          {/* Tab 1: Primitives */}
          <TabsContent value="primitives" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Button Variants</CardTitle>
                  <CardDescription>Primary, secondary, outline, destructive, and sizing.</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-2.5">
                  <Button>Primary</Button>
                  <Button variant="secondary">Secondary</Button>
                  <Button variant="outline">Outline</Button>
                  <Button variant="ghost">Ghost</Button>
                  <Button variant="destructive">Destructive</Button>
                  <Button size="sm">Small</Button>
                  <Button size="lg">Large</Button>
                  <Button disabled>Disabled</Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Form Controls</CardTitle>
                  <CardDescription>Input fields, textarea, and labels.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Input placeholder="Customer name or email" />
                  <Textarea placeholder="Terms, notes, or special contract conditions..." rows={3} />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Tab 2: Status */}
          <TabsContent value="status" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Lifecycle Status Badges</CardTitle>
                <CardDescription>
                  Unified status badges across quotations, subscriptions, and invoices.
                </CardDescription>
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
          </TabsContent>

          {/* Tab 3: Navigation */}
          <TabsContent value="navigation" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Pagination</CardTitle>
                  <CardDescription>Clean table and collection pagination.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious href="#" />
                      </PaginationItem>
                      <PaginationItem>
                        <PaginationLink href="#" isActive>
                          1
                        </PaginationLink>
                      </PaginationItem>
                      <PaginationItem>
                        <PaginationLink href="#">2</PaginationLink>
                      </PaginationItem>
                      <PaginationItem>
                        <PaginationEllipsis />
                      </PaginationItem>
                      <PaginationItem>
                        <PaginationNext href="#" />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Loading Skeleton</CardTitle>
                  <CardDescription>Content placeholder with pulse effect.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-9 w-full" />
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-surface mt-12">
        <div className="mx-auto max-w-6xl px-6 py-6 flex flex-col sm:flex-row items-center justify-between text-xs text-text-tertiary">
          <span>Brightloop — Software Subscription Management System</span>
          <span>Single-workspace operations baseline</span>
        </div>
      </footer>
    </div>
  );
}
