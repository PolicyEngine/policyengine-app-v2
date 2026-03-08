import { IconArrowRight } from '@tabler/icons-react';
import { Link } from 'react-router-dom';
import { Text } from '@/components/ui';
import { locationLabels, topicLabels } from '@/data/posts/postTransformers';
import { colors, typography } from '@/designTokens';
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
      <div className="tw:flex tw:flex-col tw:h-full tw:rounded-xl tw:overflow-hidden tw:bg-white tw:transition-all tw:duration-300 tw:ease-out tw:border tw:border-gray-200 tw:hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] tw:hover:border-gray-300 tw:hover:-translate-y-0.5">
        {/* Image */}
        <div className="tw:relative tw:h-[260px] tw:overflow-hidden tw:bg-gray-100">
          {item.image && (
            <img
              src={item.image.startsWith('http') ? item.image : `/assets/posts/${item.image}`}
              alt={item.title}
              loading="lazy"
              className="tw:w-full tw:h-full tw:object-cover tw:transition-transform tw:duration-500 tw:ease-out tw:group-hover:scale-105"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          )}
          {/* Gradient overlay at bottom of image for depth */}
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: '40px',
              background: 'linear-gradient(transparent, rgba(0,0,0,0.04))',
              pointerEvents: 'none',
            }}
          />
        </div>

        {/* Content */}
        <div
          style={{
            padding: '16px 18px',
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Tags + Date row */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '10px',
              fontSize: '11px',
              fontFamily: typography.fontFamily.primary,
              fontWeight: typography.fontWeight.medium,
              color: colors.gray[500],
              letterSpacing: '0.03em',
              textTransform: 'uppercase',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center' }}>
              {displayTags.map((tag, i) => (
                <span key={tag} style={{ display: 'inline-flex', alignItems: 'center' }}>
                  {tag}
                  {i < displayTags.length - 1 && (
                    <span style={{ margin: '0 8px', color: colors.gray[400], fontSize: '9px' }}>
                      ●
                    </span>
                  )}
                </span>
              ))}
            </div>
            <span style={{ flexShrink: 0 }}>{formattedDate}</span>
          </div>

          {/* Title */}
          <p
            style={{
              fontWeight: typography.fontWeight.semibold,
              fontSize: '15.5px',
              lineHeight: '1.4',
              color: colors.secondary[900],
              marginBottom: '8px',
              fontFamily: typography.fontFamily.primary,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              letterSpacing: '-0.01em',
            }}
          >
            {item.title}
          </p>

          {/* Description */}
          <Text
            size="sm"
            style={{
              color: colors.text.secondary,
              flex: 1,
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              lineHeight: '1.6',
            }}
          >
            {item.description}
          </Text>

          {/* CTA */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: '4px',
              marginTop: '12px',
              color: colors.primary[600],
              fontFamily: typography.fontFamily.primary,
              fontWeight: typography.fontWeight.medium,
              fontSize: '13.5px',
            }}
            className="tw:transition-all tw:duration-200 tw:group-hover:gap-2"
          >
            <span>{item.isApp ? 'Open' : 'Read more'}</span>
            <IconArrowRight
              size={15}
              className="tw:transition-transform tw:duration-200 tw:group-hover:translate-x-0.5"
            />
          </div>
        </div>
      </div>
    </Link>
  );
}
