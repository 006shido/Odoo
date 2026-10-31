import * as React from 'react';
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';

interface PaginationProps extends React.ComponentProps<'nav'> {
  className?: string;
}

function Pagination({ className, ...props }: PaginationProps) {
  return (
    <nav
      role="navigation"
      aria-label="pagination"
      className={cn('mx-auto flex w-full justify-center', className)}
      {...props}
    />
  );
}
Pagination.displayName = 'Pagination';

const PaginationContent = React.forwardRef<
  HTMLUListElement,
  React.ComponentProps<'ul'>
>(({ className, ...props }, ref) => (
  <ul
    ref={ref}
    className={cn('flex flex-row items-center gap-1', className)}
    {...props}
  />
));
PaginationContent.displayName = 'PaginationContent';

const PaginationItem = React.forwardRef<
  HTMLLIElement,
  React.ComponentProps<'li'>
>(({ className, ...props }, ref) => (
  <li ref={ref} className={cn('', className)} {...props} />
));
PaginationItem.displayName = 'PaginationItem';

type PaginationLinkProps = {
  isActive?: boolean;
} & (
  | { onClick?: () => void; href?: undefined }
  | { href: string; onClick?: () => void }
) &
  React.ComponentProps<'a'>;

function PaginationLink({
  className,
  isActive,
  ...props
}: PaginationLinkProps) {
  return (
    <a
      aria-current={isActive ? 'page' : undefined}
      className={cn(
        buttonVariants({
          variant: isActive ? 'outline' : 'ghost',
          size: 'sm',
        }),
        'h-9 w-9 p-0 cursor-pointer select-none',
        isActive && 'border-border font-medium text-text-primary bg-surface-secondary',
        className,
      )}
      {...props}
    />
  );
}
PaginationLink.displayName = 'PaginationLink';

function PaginationPrevious({
  className,
  disabled,
  ...props
}: React.ComponentProps<typeof PaginationLink> & { disabled?: boolean }) {
  return (
    <PaginationLink
      aria-label="Go to previous page"
      className={cn(
        'w-auto px-3 gap-1 select-none',
        disabled && 'pointer-events-none opacity-40 cursor-not-allowed',
        className,
      )}
      {...props}
    >
      <ChevronLeft className="h-4 w-4" />
      <span>Previous</span>
    </PaginationLink>
  );
}
PaginationPrevious.displayName = 'PaginationPrevious';

function PaginationNext({
  className,
  disabled,
  ...props
}: React.ComponentProps<typeof PaginationLink> & { disabled?: boolean }) {
  return (
    <PaginationLink
      aria-label="Go to next page"
      className={cn(
        'w-auto px-3 gap-1 select-none',
        disabled && 'pointer-events-none opacity-40 cursor-not-allowed',
        className,
      )}
      {...props}
    >
      <span>Next</span>
      <ChevronRight className="h-4 w-4" />
    </PaginationLink>
  );
}
PaginationNext.displayName = 'PaginationNext';

function PaginationEllipsis({
  className,
  ...props
}: React.ComponentProps<'span'>) {
  return (
    <span
      aria-hidden
      className={cn('flex h-9 w-9 items-center justify-center text-text-tertiary', className)}
      {...props}
    >
      <MoreHorizontal className="h-4 w-4" />
      <span className="sr-only">More pages</span>
    </span>
  );
}
PaginationEllipsis.displayName = 'PaginationEllipsis';

export {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
};
