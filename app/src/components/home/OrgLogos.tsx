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

export default function OrgLogos({ logos }: OrgLogosProps) {
  const countryId = useCurrentCountry();

  // Get organizations for current country, limit to 7
  const countryOrgs = logos[countryId as keyof OrgData];
  if (!countryOrgs) return null;

  const orgsArray = Object.values(countryOrgs).slice(0, 7);

  return (
    <Box mb={spacing['4xl']}>
      <Box
        style={{
          width: '100vw',
          marginLeft: 'calc(-50vw + 50%)',
          overflowX: 'auto',
          scrollSnapType: 'x mandatory',
        }}
      >
        <Flex
          justify="center"
          align="center"
          gap={spacing['5xl']}
          wrap="nowrap"
          px={spacing['4xl']}
          style={{ minWidth: 'max-content' }}
        >
          {orgsArray.map((org) => (
            <Box
              key={org.name}
              w={120}
              h={100}
              style={{
                flex: '0 0 auto',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                scrollSnapAlign: 'start',
              }}
            >
              <button
                type="button"
                onClick={() => window.open(org.link, '_blank')}
                style={{
                  all: 'unset',
                  cursor: 'pointer',
                }}
              >
                <img
                  src={org.logo}
                  alt={org.name}
                  style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                />
              </button>
            </Box>
          ))}
        </Flex>
      </Box>
    </Box>
  );
}
