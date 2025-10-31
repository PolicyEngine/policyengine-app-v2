import { Box, Flex } from '@mantine/core';
import { spacing } from '@/designTokens';

interface OrgLogosProps {
  logos: {
    id: string;
    src: string;
    alt: string;
    onClick?: () => void;
  }[];
}

export default function OrgLogos({ logos }: OrgLogosProps) {
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
          {logos.map((logo) => (
            <Box
              key={logo.id}
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
                onClick={logo.onClick}
                style={{
                  all: 'unset',
                  cursor: 'pointer',
                }}
              >
                <img
                  src={logo.src}
                  alt={logo.alt}
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
