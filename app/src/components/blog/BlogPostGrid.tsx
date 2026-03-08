import { useEffect, useRef, useState } from 'react';
import type { ResearchItem } from '@/types/blog';
import { BlogPostCard } from './BlogPostCard';

interface BlogPostGridProps {
  items: ResearchItem[];
  countryId: string;
}

function itemKey(item: ResearchItem) {
  return `${item.isApp ? 'app' : 'post'}-${item.slug}`;
}

export function BlogPostGrid({ items, countryId }: BlogPostGridProps) {
  const prevKeysRef = useRef<Set<string>>(new Set());
  const [newKeys, setNewKeys] = useState<Set<string>>(new Set());
  const [exitingKeys, setExitingKeys] = useState<Set<string>>(new Set());
  const [exitingItems, setExitingItems] = useState<ResearchItem[]>([]);

  useEffect(() => {
    const currentKeys = new Set(items.map(itemKey));
    const prevKeys = prevKeysRef.current;

    // Keys that are new (not in previous set)
    const entering = new Set<string>();
    currentKeys.forEach((k) => {
      if (!prevKeys.has(k)) entering.add(k);
    });

    // Keys that were removed
    const exiting = new Set<string>();
    const exitItems: ResearchItem[] = [];
    prevKeys.forEach((k) => {
      if (!currentKeys.has(k)) exiting.add(k);
    });

    // We don't have the old ResearchItem objects for exiting cards easily,
    // so we just skip exit animation and only do enter animation for new cards
    setNewKeys(entering);
    setExitingKeys(new Set());
    setExitingItems([]);
    prevKeysRef.current = currentKeys;

    // Clear the "new" status after animations complete
    if (entering.size > 0) {
      const timer = setTimeout(() => setNewKeys(new Set()), 600);
      return () => clearTimeout(timer);
    }
  }, [items]);

  return (
    <>
      <div className="tw:grid tw:grid-cols-1 tw:sm:grid-cols-2 tw:gap-4">
        {items.map((item, i) => {
          const key = itemKey(item);
          const isNew = newKeys.has(key);
          // For new cards, stagger index is based on position among new cards only
          const newIndex = isNew
            ? items.filter((it, j) => j <= i && newKeys.has(itemKey(it))).length - 1
            : 0;

          return (
            <div
              key={key}
              style={
                isNew
                  ? {
                      animation: 'cardEnter 0.35s cubic-bezier(0.4, 0, 0.2, 1) both',
                      animationDelay: `${Math.min(newIndex * 40, 300)}ms`,
                    }
                  : undefined
              }
            >
              <BlogPostCard item={item} countryId={countryId} />
            </div>
          );
        })}
      </div>
      <style>{`
        @keyframes cardEnter {
          from {
            opacity: 0;
            transform: translateY(12px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </>
  );
}
