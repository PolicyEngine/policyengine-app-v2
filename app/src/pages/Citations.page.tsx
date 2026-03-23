import { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import HeroSection from '@/components/shared/static/HeroSection';
import StaticPageLayout from '@/components/shared/static/StaticPageLayout';
import { Container, Text } from '@/components/ui';
import citationsData from '@/data/citations.json';
import { colors, spacing, typography } from '@/designTokens';
import type { Citation } from '@/types/citation';

function formatDate(dateStr: string): string {
  const date = new Date(`${dateStr}T00:00:00`);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function CitationCard({ citation, large }: { citation: Citation; large?: boolean }) {
  return (
    <a
      href={citation.url}
      target="_blank"
      rel="noopener noreferrer"
      style={{ textDecoration: 'none', color: 'inherit', height: '100%', display: 'block' }}
    >
      <div
        style={{
          borderRadius: spacing.radius.container,
          overflow: 'hidden',
          border: `1px solid ${colors.border.light}`,
          transition: 'box-shadow 0.2s ease, transform 0.2s ease',
          cursor: 'pointer',
          backgroundColor: colors.white,
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
        }}
        className="tw:hover:shadow-lg tw:hover:-translate-y-0.5"
      >
        <div
          style={{
            width: '100%',
            flex: large ? '1 1 0' : undefined,
            aspectRatio: large ? undefined : '16 / 9',
            minHeight: large ? '200px' : undefined,
            backgroundColor: colors.gray[100],
            overflow: 'hidden',
          }}
        >
          <img
            src={`/assets/citations/${citation.image}`}
            alt={`${citation.title} — ${citation.outlet}`}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
            onError={(e) => {
              const target = e.currentTarget;
              target.style.display = 'none';
              const parent = target.parentElement;
              if (parent) {
                parent.style.display = 'flex';
                parent.style.alignItems = 'center';
                parent.style.justifyContent = 'center';
                parent.style.padding = '24px';
                parent.innerHTML = `<span style="color: ${colors.gray[400]}; font-family: ${typography.fontFamily.primary}; font-size: 18px; font-weight: 600; text-align: center;">${citation.outlet}</span>`;
              }
            }}
          />
        </div>
        <div style={{ padding: spacing.lg }}>
          <Text
            size="xs"
            style={{
              color: colors.primary[600],
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: spacing.xs,
            }}
          >
            {citation.outlet}
          </Text>
          <Text
            size={large ? 'md' : 'sm'}
            style={{
              color: colors.gray[800],
              fontWeight: large ? 600 : 500,
              lineHeight: 1.4,
              marginBottom: spacing.sm,
              display: '-webkit-box',
              WebkitLineClamp: large ? 4 : 3,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {citation.title}
          </Text>
          <Text size="xs" style={{ color: colors.gray[400] }}>
            {formatDate(citation.date)}
          </Text>
        </div>
      </div>
    </a>
  );
}

function FeaturedLayout({ citations }: { citations: Citation[] }) {
  const [hero, ...side] = citations;
  if (!hero) {
    return null;
  }

  if (side.length === 0) {
    return <CitationCard citation={hero} large />;
  }

  return (
    <div
      style={{
        display: 'flex',
        gap: spacing['2xl'],
      }}
      className="tw:max-md:flex-col"
    >
      {/* Large card on the left — takes 2/3 width */}
      <div style={{ flex: '2 1 0', minWidth: 0 }}>
        <CitationCard citation={hero} large />
      </div>

      {/* Two smaller cards stacked on the right — takes 1/3 width */}
      <div
        style={{
          flex: '1 1 0',
          minWidth: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: spacing['2xl'],
        }}
      >
        {side.slice(0, 2).map((citation, i) => (
          <CitationCard key={`side-${citation.url}-${i}`} citation={citation} />
        ))}
      </div>
    </div>
  );
}

export default function CitationsPage() {
  const { countryId = 'us' } = useParams<{ countryId: string }>();

  const citations = citationsData as Citation[];

  const countryCitations = useMemo(() => {
    return citations.filter((c) => c.tags.includes(countryId) || c.tags.includes('global'));
  }, [citations, countryId]);

  // Featured citations keep their JSON order (so you control the hero card)
  const featuredCitations = useMemo(
    () => countryCitations.filter((c) => c.featured),
    [countryCitations]
  );

  // Non-featured citations sorted by date descending
  const restCitations = useMemo(
    () =>
      countryCitations
        .filter((c) => !c.featured)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [countryCitations]
  );

  return (
    <StaticPageLayout title="Citations">
      <HeroSection
        title="Citations"
        description="PolicyEngine research and tools cited in the press and by policymakers."
      />

      <Container size="xl" className="tw:py-xl">
        {countryCitations.length === 0 ? (
          <div
            className="tw:text-center"
            style={{
              padding: spacing['3xl'],
              backgroundColor: colors.gray[50],
              borderRadius: spacing.radius.container,
            }}
          >
            <Text style={{ color: colors.gray[500] }}>No citations yet.</Text>
          </div>
        ) : (
          <>
            {/* Featured */}
            {featuredCitations.length > 0 && (
              <section style={{ marginBottom: spacing['3xl'] }}>
                <Text
                  size="lg"
                  style={{
                    fontWeight: 600,
                    color: colors.gray[800],
                    marginBottom: spacing.xl,
                  }}
                >
                  Featured
                </Text>
                <FeaturedLayout citations={featuredCitations} />
              </section>
            )}

            {/* Rest sorted by date */}
            {restCitations.length > 0 && (
              <section>
                <Text
                  size="lg"
                  style={{
                    fontWeight: 600,
                    color: colors.gray[800],
                    marginBottom: spacing.xl,
                  }}
                >
                  All citations
                </Text>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                    gap: spacing['2xl'],
                  }}
                >
                  {restCitations.map((citation, i) => (
                    <CitationCard key={`rest-${citation.url}-${i}`} citation={citation} />
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </Container>
    </StaticPageLayout>
  );
}
