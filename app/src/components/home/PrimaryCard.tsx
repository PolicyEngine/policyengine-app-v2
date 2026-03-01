import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import type { BlogPost } from '@/types/blog';
import { formatPostDate, getPostImageUrl } from './blogPreviewUtils';

interface PrimaryCardProps {
  post: BlogPost;
  countryId: string;
  flex?: number;
}

export default function PrimaryCard({ post, countryId, flex }: PrimaryCardProps) {
  const imageUrl = getPostImageUrl(post);
  const date = formatPostDate(post.date);

  return (
    <Link
      to={`/${countryId}/research/${post.slug}`}
      className="tw:block tw:no-underline tw:text-inherit tw:group"
      style={{ flex: flex ?? 'none' }}
    >
      <div
        className={cn(
          'tw:flex tw:flex-col tw:h-full',
          'tw:rounded-feature tw:overflow-hidden tw:bg-white tw:border tw:border-border-light',
          'tw:transition-all tw:duration-300 tw:ease-out',
          'tw:hover:shadow-[0_8px_30px_rgba(16,24,40,0.1)] tw:hover:-translate-y-0.5',
          'tw:focus-within:shadow-[0_0_0_2px_var(--color-primary-500)] tw:focus-within:outline-none'
        )}
      >
        {imageUrl && (
          <div className="tw:min-h-[200px] tw:flex-1 tw:overflow-hidden tw:bg-gray-100">
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

        <div className="tw:p-2xl tw:shrink-0">
          <p className="tw:text-xs tw:font-semibold tw:text-primary-600 tw:uppercase tw:tracking-wide tw:mb-sm">
            {date}
          </p>

          <p className="tw:text-2xl tw:font-bold tw:leading-tight tw:text-gray-900 tw:mb-md">
            {post.title}
          </p>

          <p className="tw:text-sm tw:text-text-secondary tw:leading-relaxed tw:line-clamp-3">
            {post.description}
          </p>

          <p className="tw:text-sm tw:font-semibold tw:text-primary-600 tw:mt-lg tw:transition-transform tw:duration-200 tw:group-hover:translate-x-1">
            Read more &rarr;
          </p>
        </div>
      </div>
    </Link>
  );
}
