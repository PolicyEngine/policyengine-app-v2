import { describe, expect, it } from 'vitest';
import { cn } from '@/lib/utils';

describe('Tailwind foundation', () => {
  it('cn() merges class names correctly', () => {
    expect(cn('tw:flex', 'tw:gap-4')).toBe('tw:flex tw:gap-4');
  });

  it('cn() deduplicates conflicting classes', () => {
    // tailwind-merge should resolve conflicts
    expect(cn('tw:p-4', 'tw:p-8')).toBe('tw:p-8');
  });

  it('cn() handles conditional classes', () => {
    const isActive = true;
    const isDisabled = false;
    expect(cn('tw:flex', isActive && 'tw:bg-primary-500', isDisabled && 'tw:opacity-50')).toBe(
      'tw:flex tw:bg-primary-500'
    );
  });

  it('cn() handles undefined and null gracefully', () => {
    expect(cn('tw:flex', undefined, null, 'tw:gap-4')).toBe('tw:flex tw:gap-4');
  });

  it('cn() merges arrays of classes', () => {
    expect(cn(['tw:flex', 'tw:items-center'], 'tw:gap-4')).toBe('tw:flex tw:items-center tw:gap-4');
  });
});
