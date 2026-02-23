import type { ResearchItem } from '@/types/blog';
import { BlogPostCard } from './BlogPostCard';

interface BlogPostGridProps {
  items: ResearchItem[];
  countryId: string;
}

export function BlogPostGrid({ items, countryId }: BlogPostGridProps) {
  return (
    <div className="tw:grid tw:grid-cols-1 sm:tw:grid-cols-2 tw:gap-4">
      {items.map((item) => (
        <BlogPostCard
          key={`${item.isApp ? 'app' : 'post'}-${item.slug}`}
          item={item}
          countryId={countryId}
        />
      ))}
    </div>
  );
}
