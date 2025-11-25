import { useEffect, useMemo, useState } from 'react';
import { Box, Flex, Text } from '@mantine/core';
import { colors, spacing, typography } from '@/designTokens';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';

interface Organization {
  name: string;
  logo: string;
  link: string;
}

interface OrgData {
  uk: Record<string, Organization>;
  us: Record<string, Organization>;
}

interface OrgLogosProps {
  logos: OrgData;
}

const LOGOS_PER_PAGE = 7;
const CYCLE_INTERVAL = 4000;

// Fisher-Yates shuffle
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export default function OrgLogos({ logos }: OrgLogosProps) {
  const countryId = useCurrentCountry();
  const [currentPage, setCurrentPage] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const countryOrgs = logos[countryId as keyof OrgData];

  // Shuffle logos once on mount and memoize
  const shuffledOrgs = useMemo(() => {
    if (!countryOrgs) {
      return [];
    }
    return shuffleArray(Object.values(countryOrgs));
  }, [countryOrgs]);

  // Only show complete pages (no partial last row)
  const totalFullPages = Math.floor(shuffledOrgs.length / LOGOS_PER_PAGE);
  const displayableOrgs = shuffledOrgs.slice(0, totalFullPages * LOGOS_PER_PAGE);
  const totalPages = totalFullPages;

  // Get current page of logos
  const startIdx = currentPage * LOGOS_PER_PAGE;
  const currentLogos = displayableOrgs.slice(startIdx, startIdx + LOGOS_PER_PAGE);

  // Auto-cycle through pages
  useEffect(() => {
    if (totalPages <= 1) {
      return;
    }

    const interval = setInterval(() => {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentPage((prev) => (prev + 1) % totalPages);
        setIsTransitioning(false);
      }, 300);
    }, CYCLE_INTERVAL);

    return () => clearInterval(interval);
  }, [totalPages]);

  if (!countryOrgs || currentLogos.length === 0) {
    return null;
  }

  return (
    <Box mt={spacing['4xl']} mb={spacing['4xl']}>
      <Text
        ta="center"
        size="lg"
        c={colors.primary[600]}
        fw={typography.fontWeight.medium}
        mb={spacing.xl}
        style={{ fontFamily: typography.fontFamily.primary }}
      >
        Trusted by researchers and policy organizations
      </Text>

      <Box
        style={{
          width: '100vw',
          marginLeft: 'calc(-50vw + 50%)',
          overflowX: 'hidden',
        }}
      >
        <Flex
          justify="center"
          align="center"
          gap={spacing['5xl']}
          wrap="nowrap"
          px={spacing['4xl']}
          style={{
            minWidth: 'max-content',
            opacity: isTransitioning ? 0 : 1,
            transition: 'opacity 0.3s ease-in-out',
          }}
        >
          {currentLogos.map((org) => (
            <Box
              key={org.name}
              style={{
                flex: '0 0 auto',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                width: '120px',
                height: '100px',
              }}
            >
              <button
                type="button"
                onClick={() => window.open(org.link, '_blank')}
                style={{
                  all: 'unset',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '100%',
                  height: '100%',
                }}
              >
                <img
                  src={org.logo}
                  alt={org.name}
                  style={{
                    maxWidth: '120px',
                    maxHeight: '100px',
                    width: 'auto',
                    height: 'auto',
                  }}
                />
              </button>
            </Box>
          ))}
        </Flex>
      </Box>

      {/* Pagination dots */}
      {totalPages > 1 && (
        <Flex justify="center" gap={spacing.xs} mt={spacing.lg}>
          {Array.from({ length: totalPages }).map((_, idx) => (
            <Box
              key={idx}
              onClick={() => {
                setIsTransitioning(true);
                setTimeout(() => {
                  setCurrentPage(idx);
                  setIsTransitioning(false);
                }, 300);
              }}
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                backgroundColor: idx === currentPage ? '#132F46' : '#D1D5DB',
                cursor: 'pointer',
                transition: 'background-color 0.2s ease',
              }}
            />
          ))}
        </Flex>
      )}
    </Box>
  );
}
