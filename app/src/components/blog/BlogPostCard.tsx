import { Link } from 'react-router-dom';
import { Badge, Group, Text } from '@/components/ui';
import { locationLabels, topicLabels } from '@/data/posts/postTransformers';
import { cn } from '@/lib/utils';
import type { ResearchItem } from '@/types/blog';

interface BlogPostCardProps {
  item: ResearchItem;
  countryId: string;
}

export function BlogPostCard({ item, countryId }: BlogPostCardProps) {
  const link = item.isApp
    ? `/${item.countryId}/${item.slug}`
    : `/${countryId}/research/${item.slug}`;

  const formattedDate = new Date(item.date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  const displayTags = item.tags
    .filter((tag) => topicLabels[tag] || locationLabels[tag])
    .slice(0, 3)
    .map((tag) => topicLabels[tag] || locationLabels[tag] || tag);

  return (
    <Link to={link} className="tw:no-underline tw:text-inherit tw:group">
      <div
        className={cn(
          'tw:flex tw:flex-col tw:h-full',
          'tw:border tw:border-gray-300 tw:rounded-container tw:overflow-hidden tw:bg-white',
          'tw:transition-shadow tw:duration-200 tw:ease-out',
          'tw:hover:shadow-[0_4px_12px_var(--color-gray-300)]'
        )}
      >
        <div className="tw:h-[200px] tw:overflow-hidden tw:bg-gray-100">
          {item.image && (
            <img
              src={item.image.startsWith('http') ? item.image : `/assets/posts/${item.image}`}
              alt={item.title}
              loading="lazy"
              className="tw:w-full tw:h-full tw:object-cover tw:transition-transform tw:duration-500 tw:group-hover:scale-[1.03]"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          )}
        </div>

        <div className="tw:p-md tw:flex-1 tw:flex tw:flex-col">
          <Group justify="space-between" className="tw:mb-xs">
            <Group gap="xs">
              {displayTags.map((tag) => (
                <Badge
                  key={tag}
                  variant="secondary"
                  className={cn(
                    'tw:text-[10px] tw:px-1.5 tw:py-0',
                    item.isApp
                      ? 'tw:bg-primary-100 tw:text-primary-700'
                      : 'tw:bg-blue-100 tw:text-blue-700'
                  )}
                >
                  {tag}
                </Badge>
              ))}
            </Group>
            <Text size="xs" c="dimmed" className="tw:uppercase" span>
              {formattedDate}
            </Text>
          </Group>

          <p className="tw:font-semibold tw:text-base tw:text-gray-900 tw:mb-xs tw:line-clamp-2">
            {item.title}
          </p>

          <Text size="sm" c="dimmed" className="tw:flex-1 tw:line-clamp-3">
            {item.description}
          </Text>

          <p className="tw:text-sm tw:text-primary-600 tw:text-right tw:mt-sm tw:transition-transform tw:duration-200 tw:group-hover:translate-x-1">
            {item.isApp ? 'Open \u2192' : 'Read \u2192'}
          </p>
        </div>
      </div>
    </Link>
  );
}
