import { useEffect, useState } from 'react';
import { Box, Flex } from '@mantine/core';
import { spacing } from '@/designTokens';
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

export default function OrgLogos({ logos }: OrgLogosProps) {
  const countryId = useCurrentCountry();
  const [currentPage, setCurrentPage] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const countryOrgs = logos[countryId as keyof OrgData];
  if (!countryOrgs) {
    return null;
  }

  const orgsArray = Object.values(countryOrgs);
  const totalPages = Math.ceil(orgsArray.length / LOGOS_PER_PAGE);

  // Get current page of logos
  const startIdx = currentPage * LOGOS_PER_PAGE;
  const currentLogos = orgsArray.slice(startIdx, startIdx + LOGOS_PER_PAGE);

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

  return (
    <Box mb={spacing['4xl']}>
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
