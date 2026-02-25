import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import type { BlogPost } from '@/types/blog';
import { formatPostDate, getPostImageUrl } from './blogPreviewUtils';

interface SecondaryCardProps {
  post: BlogPost;
  countryId: string;
}

export default function SecondaryCard({ post, countryId }: SecondaryCardProps) {
  const imageUrl = getPostImageUrl(post);
  const date = formatPostDate(post.date);

  return (
    <Link
      to={`/${countryId}/research/${post.slug}`}
      className="tw:block tw:no-underline tw:text-inherit tw:h-full tw:group"
    >
      <div
        className={cn(
          'tw:flex tw:flex-col tw:h-full',
          'tw:rounded-feature tw:overflow-hidden tw:bg-white tw:border tw:border-border-light',
          'tw:transition-all tw:duration-300 tw:ease-out',
          'tw:hover:shadow-[0_6px_24px_rgba(16,24,40,0.1)] tw:hover:-translate-y-0.5',
          'tw:focus-within:shadow-[0_0_0_2px_var(--color-primary-500)] tw:focus-within:outline-none'
        )}
      >
        {imageUrl && (
          <div className="tw:h-[180px] tw:overflow-hidden tw:bg-gray-100 tw:shrink-0">
            <img
              src={imageUrl}
              alt={post.title}
              className="tw:w-full tw:h-full tw:object-cover tw:block tw:transition-transform tw:duration-500 tw:group-hover:scale-[1.03]"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          </div>
        )}

        <div className="tw:flex tw:flex-col tw:flex-1 tw:p-lg">
          <p className="tw:text-xs tw:font-semibold tw:text-primary-600 tw:uppercase tw:tracking-wide tw:mb-xs">
            {date}
          </p>

          <p className="tw:text-base tw:font-semibold tw:leading-snug tw:text-gray-900 tw:line-clamp-2 tw:mb-sm">
            {post.title}
          </p>

          <p className="tw:text-sm tw:text-text-secondary tw:leading-normal tw:line-clamp-2 tw:flex-1">
            {post.description}
          </p>

          <p className="tw:text-sm tw:font-semibold tw:text-primary-600 tw:mt-md tw:transition-transform tw:duration-200 tw:group-hover:translate-x-1">
            Read &rarr;
          </p>
        </div>
      </div>
    </Link>
  );
}
