/**
 * BlogPostGrid Component
 *
 * Grid layout for displaying blog post cards.
 * Responsive: 2 columns on desktop, 1 on mobile/tablet.
 */

import { SimpleGrid } from '@mantine/core';
import type { ResearchItem } from '@/types/blog';
import { BlogPostCard } from './BlogPostCard';

interface BlogPostGridProps {
  items: ResearchItem[];
  countryId: string;
}

export function BlogPostGrid({ items, countryId }: BlogPostGridProps) {
  return (
    <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="lg">
      {items.map((item) => (
        <BlogPostCard
          key={`${item.isApp ? 'app' : 'post'}-${item.slug}`}
          item={item}
          countryId={countryId}
        />
      ))}
    </SimpleGrid>
  );
}
