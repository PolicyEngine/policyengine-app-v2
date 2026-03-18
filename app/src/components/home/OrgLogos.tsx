import { useMemo } from 'react';
import { Text } from '@/components/ui';
import OptimisedImage from '@/components/ui/OptimisedImage';
import { CountryId, getOrgsForCountry, Organization } from '@/data/organizations';
import { colors, spacing, typography } from '@/designTokens';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';

const LOGO_WIDTH = 140;
const LOGO_GAP = 64;

// Fisher-Yates shuffle
function shuffle<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function LogoItem({ org }: { org: Organization }) {
  return (
    <a
      href={org.link}
      target="_blank"
      rel="noopener noreferrer"
      title={org.name}
      style={{
        flex: '0 0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: `${LOGO_WIDTH}px`,
        height: '80px',
        opacity: 0.7,
        transition: 'opacity 0.2s ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.opacity = '1';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.opacity = '0.7';
      }}
    >
      <OptimisedImage
        src={org.logo}
        alt={org.name}
        width={LOGO_WIDTH}
        height={70}
        style={{
          maxWidth: `${LOGO_WIDTH}px`,
          maxHeight: '70px',
          width: 'auto',
          height: 'auto',
        }}
      />
    </a>
  );
}

export default function OrgLogos() {
  const countryId = useCurrentCountry() as CountryId;

  const orgs = useMemo(() => {
    return shuffle(getOrgsForCountry(countryId));
  }, [countryId]);

  if (orgs.length === 0) {
    return null;
  }

  // Total width of one full set of logos
  const setWidth = orgs.length * (LOGO_WIDTH + LOGO_GAP);

  // ~40px/s — slow enough to read, fast enough to notice movement
  const duration = setWidth / 40;

  return (
    <div style={{ marginTop: spacing['4xl'], marginBottom: spacing['4xl'] }}>
      <Text
        size="lg"
        c={colors.primary[600]}
        fw={typography.fontWeight.medium}
        style={{
          textAlign: 'center',
          marginBottom: spacing.xl,
          fontFamily: typography.fontFamily.primary,
        }}
      >
        {countryId === 'us'
          ? 'Trusted by researchers, governments, and benefit platforms'
          : 'Trusted by researchers and policy organisations'}
      </Text>

      <div
        style={{
          width: '100%',
          overflow: 'hidden',
          maskImage:
            'linear-gradient(to right, transparent 0%, black 10%, black 90%, transparent 100%)',
          WebkitMaskImage:
            'linear-gradient(to right, transparent 0%, black 10%, black 90%, transparent 100%)',
        }}
      >
        <div
          className="org-logos-track"
          style={{
            display: 'flex',
            gap: `${LOGO_GAP}px`,
            width: 'max-content',
            animation: `marquee ${duration}s linear infinite`,
          }}
        >
          {/* Render two copies for seamless loop */}
          {orgs.map((org, i) => (
            <LogoItem key={`a-${i}`} org={org} />
          ))}
          {orgs.map((org, i) => (
            <LogoItem key={`b-${i}`} org={org} />
          ))}
        </div>
      </div>

      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-${setWidth}px); }
        }
        .org-logos-track:hover {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  );
}
