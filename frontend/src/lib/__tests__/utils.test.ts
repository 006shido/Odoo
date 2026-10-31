import { describe, it, expect } from 'vitest';
import { cn, formatDate } from '@/lib/utils';

describe('cn', () => {
  it('merges class names', () => {
    expect(cn('px-2', 'py-1')).toBe('px-2 py-1');
  });

  it('handles conditional classes', () => {
    expect(cn('base', false && 'hidden', 'extra')).toBe('base extra');
  });

  it('deduplicates tailwind classes', () => {
    expect(cn('px-2', 'px-4')).toBe('px-4');
  });
});

describe('formatDate', () => {
  it('formats a date string', () => {
    const result = formatDate('2026-10-31T00:00:00Z');
    expect(result).toContain('Oct');
    expect(result).toContain('2026');
  });
});
