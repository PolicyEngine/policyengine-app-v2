import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Card, Center, Container, Flex, Stack, Text, Title } from '@mantine/core';
import HeaderNavigation from '@/components/shared/HomeHeader';
import { colors, spacing, typography } from '@/designTokens';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';
import cgo from '@/images/logos/orgs/cgo.jpg';
import epmt from '@/images/logos/orgs/epmt.jpg';
import f4gi from '@/images/logos/orgs/f4gi.jpg';
import mca from '@/images/logos/orgs/mca.jpg';
import myfriendben from '@/images/logos/orgs/myfriendben.png';
import nisk from '@/images/logos/orgs/niskanen-center.png';
import pn3policy from '@/images/logos/orgs/pn3policy.png';

const MainSection: React.FC = () => (
  <Container size="xl" py={spacing['5xl']}>
    <Stack
      align="center"
      gap={spacing['3xl']}
      style={{
        margin: '0 auto',
        maxWidth: spacing.layout.container,
      }}
    >
      <Title
        size={48}
        fw={typography.fontWeight.bold}
        ta="center"
        c={colors.primary[800]}
        style={{
          lineHeight: typography.lineHeight.tight,
          fontFamily: typography.fontFamily.primary,
        }}
      >
        Computing Public Policy
        <br />
        for Everyone
      </Title>

      <Text
        size={typography.fontSize['2xl']}
        c="#132F46"
        ta="center"
        fw={typography.fontWeight.normal}
        style={{
          lineHeight: typography.lineHeight.normal,
          fontFamily: typography.fontFamily.secondary,
        }}
      >
        Understand and analyze the impacts of tax and benefit policies
        <br /> on budgets, economic growth, poverty, and inequality.
      </Text>
    </Stack>
  </Container>
);

const ActionCards: React.FC = () => {
  const countryId = useCurrentCountry();
  const navigate = useNavigate();

  return (
    <Container size="xl" pb={spacing['4xl']}>
      <Center>
        <Card
          shadow="sm"
          p={spacing.xl}
          radius={spacing.radius.md}
          withBorder
          onClick={() => navigate(`/${countryId}/app/dashboard`)}
          style={{
            backgroundColor: 'transparent',
            cursor: 'pointer',
            borderColor: colors.primary[500],
            borderWidth: 1.5,
            fontFamily: typography.fontFamily.primary,
          }}
        >
          <Text fw={typography.fontWeight.semibold} c={colors.primary[500]} size="xl">
            Start building
          </Text>
        </Card>
      </Center>
    </Container>
  );
};

const TransformationStatement: React.FC = () => (
  <Container size="xl" py={spacing['4xl']} mt={spacing['2xl']}>
    <Center>
      <Text
        size="xl"
        fw={typography.fontWeight.semibold}
        c="#132F46"
        ta="center"
        style={{ fontFamily: typography.fontFamily.primary }}
      >
        Transforming how policy professionals analyze and implement
      </Text>
    </Center>
  </Container>
);

interface OrgLogosProps {
  logos: {
    id: string;
    src: string;
    alt: string;
    onClick?: () => void;
  }[];
}

const OrgLogos: React.FC<OrgLogosProps> = ({ logos }) => (
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

const orgLogos = [
  {
    id: '1',
    src: f4gi,
    alt: 'Fund for Guaranteed Income',
    onClick: () => window.open('https://www.f4gi.org/', '_blank'),
  },
  {
    id: '2',
    src: mca,
    alt: 'Maryland Child Alliance',
    onClick: () => window.open('https://www.marylandchildalliance.org/revenue-raisers', '_blank'),
  },
  {
    id: '3',
    src: epmt,
    alt: 'End Poverty Make Trillions',
    onClick: () => window.open('https://endpovertymaketrillions.com/', '_blank'),
  },
  {
    id: '4',
    src: pn3policy,
    alt: 'Prenatal-to-3 Policy Impact Center',
    onClick: () => window.open('https://www.pn3policy.org/', '_blank'),
  },
  {
    id: '5',
    src: myfriendben,
    alt: 'MyFriendBen',
    onClick: () => window.open('https://www.myfriendben.org/', '_blank'),
  },
  {
    id: '6',
    src: nisk,
    alt: 'Niskanen Center',
    onClick: () =>
      window.open(
        'https://www.niskanencenter.org/building-a-stronger-foundation-for-american-families-options-for-child-tax-credit-reform/',
        '_blank'
      ),
  },
  {
    id: '7',
    src: cgo,
    alt: 'Center for Growth and Opportunity',
    onClick: () =>
      window.open(
        'https://www.thecgo.org/research/how-does-targeted-cash-assistance-affect-incentives-to-work/',
        '_blank'
      ),
  },
];

const PolicyEngineLanding: React.FC = () => {
  return (
    <Box
      style={{
        backgroundImage: `linear-gradient(180deg, ${colors.primary[50]}, #f2fcfaff, ${colors.white})`,
        minHeight: '100vh',
        fontFamily: typography.fontFamily.primary,
        position: 'relative',
      }}
    >
      <HeaderNavigation />

      <Box pt={`calc(${spacing.layout.header} + ${spacing['4xl']})`}>
        <MainSection />
        <ActionCards />
        <TransformationStatement />
      </Box>
      <OrgLogos logos={orgLogos} />
    </Box>
  );
};

export default PolicyEngineLanding;
