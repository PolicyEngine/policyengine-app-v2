import { Box, Flex, List, Text, Title } from '@mantine/core';
import { Link } from 'react-router-dom';
import StaticPageLayout from '@/components/shared/static/StaticPageLayout';
import { colors, spacing, typography } from '@/designTokens';

function SectionTitle({ children }: { children: string }) {
  return (
    <Title
      order={2}
      mb="lg"
      pb="md"
      style={{
        fontSize: typography.fontSize['2xl'],
        fontWeight: typography.fontWeight.semibold,
        fontFamily: typography.fontFamily.primary,
        color: colors.text.primary,
        borderBottom: `1px solid ${colors.border.light}`,
      }}
    >
      {children}
    </Title>
  );
}

function RuleTitle({ children }: { children: string }) {
  return (
    <Title
      order={3}
      mb="sm"
      style={{
        fontSize: typography.fontSize.lg,
        fontWeight: typography.fontWeight.semibold,
        fontFamily: typography.fontFamily.primary,
        color: colors.text.primary,
      }}
    >
      {children}
    </Title>
  );
}

function RuleDescription({ children }: { children: string }) {
  return (
    <Text
      mb="md"
      style={{
        fontSize: typography.fontSize.base,
        color: colors.text.secondary,
        lineHeight: typography.lineHeight.relaxed,
      }}
    >
      {children}
    </Text>
  );
}

function ExampleBox({ type, children }: { type: 'good' | 'bad'; children: React.ReactNode }) {
  const isGood = type === 'good';
  return (
    <Box
      p="md"
      style={{
        background: isGood ? `${colors.success}10` : `${colors.error}10`,
        border: `1px solid ${isGood ? colors.success : colors.error}30`,
        borderRadius: spacing.radius.md,
      }}
    >
      <Text
        mb="sm"
        style={{
          fontSize: typography.fontSize.xs,
          fontWeight: typography.fontWeight.semibold,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          color: isGood ? colors.success : colors.error,
        }}
      >
        {isGood ? '✓ Correct' : '✗ Incorrect'}
      </Text>
      <Text
        style={{
          fontSize: typography.fontSize.sm,
          color: colors.text.primary,
          lineHeight: typography.lineHeight.relaxed,
        }}
      >
        {children}
      </Text>
    </Box>
  );
}

function TermItem({ term, definition }: { term: string; definition: string }) {
  return (
    <Flex
      p="md"
      gap="lg"
      align="center"
      style={{
        background: colors.white,
        border: `1px solid ${colors.border.light}`,
        borderRadius: spacing.radius.md,
      }}
    >
      <Text
        style={{
          width: 140,
          flexShrink: 0,
          fontFamily: typography.fontFamily.mono,
          fontWeight: typography.fontWeight.semibold,
          color: colors.primary[600],
        }}
      >
        {term}
      </Text>
      <Text
        style={{
          fontSize: typography.fontSize.sm,
          color: colors.text.secondary,
        }}
      >
        {definition}
      </Text>
    </Flex>
  );
}

function TipBox({ children }: { children: React.ReactNode }) {
  return (
    <Box
      p="lg"
      mt="lg"
      style={{
        background: `${colors.primary[500]}08`,
        border: `1px solid ${colors.primary[500]}20`,
        borderRadius: spacing.radius.md,
      }}
    >
      <Text
        mb="sm"
        style={{
          fontSize: typography.fontSize.sm,
          fontWeight: typography.fontWeight.semibold,
          color: colors.primary[600],
        }}
      >
        Pro tip
      </Text>
      <Text
        style={{
          fontSize: typography.fontSize.sm,
          color: colors.text.secondary,
          lineHeight: typography.lineHeight.relaxed,
        }}
      >
        {children}
      </Text>
    </Box>
  );
}

export default function BrandWritingPage() {
  return (
    <StaticPageLayout title="Writing guide">
      {/* Hero */}
      <Box
        py={spacing['4xl']}
        style={{
          backgroundColor: '#F7FEFE',
          borderBottom: `1px solid ${colors.border.dark}`,
          paddingLeft: '6.125%',
          paddingRight: '6.125%',
        }}
      >
        <Text
          style={{
            fontSize: typography.fontSize.sm,
            color: colors.text.secondary,
            marginBottom: spacing.md,
          }}
        >
          <Link to="../brand" style={{ color: colors.primary[500], textDecoration: 'none' }}>
            Brand
          </Link>
          {' / '}
          Writing
        </Text>
        <Title
          style={{
            fontSize: typography.fontSize['4xl'],
            fontWeight: typography.fontWeight.semibold,
            fontFamily: typography.fontFamily.primary,
            color: colors.text.primary,
            marginBottom: spacing.md,
          }}
        >
          Writing guide
        </Title>
        <Text
          style={{
            fontSize: typography.fontSize.lg,
            color: colors.text.secondary,
            maxWidth: 600,
          }}
        >
          How PolicyEngine communicates. Voice, tone, and content guidelines for research-oriented writing.
        </Text>
      </Box>

      {/* Content */}
      <Box
        py={spacing['4xl']}
        style={{
          paddingLeft: '6.125%',
          paddingRight: '6.125%',
          maxWidth: 800,
        }}
      >
        {/* Sentence case */}
        <Box mb={spacing['4xl']}>
          <SectionTitle>Sentence case</SectionTitle>
          <Text
            mb="xl"
            style={{
              fontSize: typography.fontSize.base,
              color: colors.text.secondary,
              lineHeight: typography.lineHeight.relaxed,
            }}
          >
            Always use sentence case for headings, not title case. This follows the modern
            standard used by Apple, Google, Slack, Notion, and GOV.UK.
          </Text>

          <Box mb="xl">
            <RuleTitle>The rule</RuleTitle>
            <RuleDescription>
              Capitalize only the first word of a heading and any proper nouns.
              Everything else stays lowercase.
            </RuleDescription>
            <Flex gap="md" direction={{ base: 'column', sm: 'row' }}>
              <Box flex={1}>
                <ExampleBox type="good">
                  How tax reform affects families<br />
                  Understanding the EITC<br />
                  Getting started with PolicyEngine<br />
                  Why microsimulation matters
                </ExampleBox>
              </Box>
              <Box flex={1}>
                <ExampleBox type="bad">
                  How Tax Reform Affects Families<br />
                  Understanding The EITC<br />
                  Getting Started With PolicyEngine<br />
                  Why Microsimulation Matters
                </ExampleBox>
              </Box>
            </Flex>
          </Box>

          <Box mb="xl">
            <RuleTitle>Proper nouns stay capitalized</RuleTitle>
            <RuleDescription>
              Brand names, acronyms, and proper nouns keep their capitalization.
            </RuleDescription>
            <Flex gap="md" direction={{ base: 'column', sm: 'row' }}>
              <Box flex={1}>
                <ExampleBox type="good">
                  How AI affects income distribution<br />
                  Analyzing the American Rescue Plan<br />
                  UK benefit calculations<br />
                  Building with PolicyEngine
                </ExampleBox>
              </Box>
              <Box flex={1}>
                <ExampleBox type="bad">
                  How ai affects income distribution<br />
                  Analyzing the american rescue plan<br />
                  Uk benefit calculations<br />
                  Building with policyengine
                </ExampleBox>
              </Box>
            </Flex>
          </Box>

          <Box>
            <RuleTitle>Where this applies</RuleTitle>
            <RuleDescription>
              Use sentence case consistently across all content:
            </RuleDescription>
            <List
              style={{ color: colors.text.secondary, lineHeight: 1.8 }}
              styles={{ itemWrapper: { marginBottom: spacing.xs } }}
            >
              <List.Item>Page titles and headings</List.Item>
              <List.Item>Navigation labels</List.Item>
              <List.Item>Button text</List.Item>
              <List.Item>Form labels</List.Item>
              <List.Item>Documentation titles</List.Item>
              <List.Item>Blog post titles</List.Item>
              <List.Item>Error messages</List.Item>
            </List>
          </Box>
        </Box>

        {/* Voice and tone */}
        <Box mb={spacing['4xl']}>
          <SectionTitle>Voice and tone</SectionTitle>
          <Text
            mb="xl"
            style={{
              fontSize: typography.fontSize.base,
              color: colors.text.secondary,
              lineHeight: typography.lineHeight.relaxed,
            }}
          >
            PolicyEngine's voice is research-oriented but accessible. We explain complex policy
            concepts clearly while maintaining rigor. When writing about our products, the tone
            can be more natural and conversational.
          </Text>

          <Box mb="xl">
            <RuleTitle>Use active voice</RuleTitle>
            <RuleDescription>
              Write in active voice. The subject should perform the action, not receive it.
            </RuleDescription>
            <Flex gap="md" direction={{ base: 'column', sm: 'row' }}>
              <Box flex={1}>
                <ExampleBox type="good">
                  The policy increases benefits by $1,200/year.<br />
                  We validated against IRS data.<br />
                  PolicyEngine calculates taxes for all 50 states.
                </ExampleBox>
              </Box>
              <Box flex={1}>
                <ExampleBox type="bad">
                  Benefits are increased by $1,200/year by the policy.<br />
                  Validation was performed against IRS data.<br />
                  Taxes for all 50 states are calculated by PolicyEngine.
                </ExampleBox>
              </Box>
            </Flex>
          </Box>

          <Box mb="xl">
            <RuleTitle>Be direct</RuleTitle>
            <RuleDescription>
              Get to the point. Avoid filler words and unnecessary qualifiers.
            </RuleDescription>
            <Flex gap="md" direction={{ base: 'column', sm: 'row' }}>
              <Box flex={1}>
                <ExampleBox type="good">
                  The reform costs $50 billion annually.
                </ExampleBox>
              </Box>
              <Box flex={1}>
                <ExampleBox type="bad">
                  It can be noted that the reform would cost approximately $50 billion per year.
                </ExampleBox>
              </Box>
            </Flex>
          </Box>

          <Box mb="xl">
            <RuleTitle>Be precise</RuleTitle>
            <RuleDescription>
              Use specific numbers and concrete examples. Avoid vague claims.
            </RuleDescription>
            <Flex gap="md" direction={{ base: 'column', sm: 'row' }}>
              <Box flex={1}>
                <ExampleBox type="good">
                  The policy affects 42 million households.
                </ExampleBox>
              </Box>
              <Box flex={1}>
                <ExampleBox type="bad">
                  The policy affects many households.
                </ExampleBox>
              </Box>
            </Flex>
          </Box>

          <Box mb="xl">
            <RuleTitle>Present numbers dispassionately</RuleTitle>
            <RuleDescription>
              When presenting results from PolicyEngine, let the data speak for itself.
              Avoid adjectives or adverbs that aren't backed by the numbers themselves.
            </RuleDescription>
            <Flex gap="md" direction={{ base: 'column', sm: 'row' }}>
              <Box flex={1}>
                <ExampleBox type="good">
                  The policy reduces poverty by 15%.<br />
                  Average benefits increase by $2,400/year.<br />
                  The reform costs $80 billion annually.
                </ExampleBox>
              </Box>
              <Box flex={1}>
                <ExampleBox type="bad">
                  The policy dramatically slashes poverty by an impressive 15%.<br />
                  Benefits skyrocket by a remarkable $2,400/year.<br />
                  The reform has a surprisingly modest cost of just $80 billion.
                </ExampleBox>
              </Box>
            </Flex>
          </Box>
        </Box>

        {/* Terminology */}
        <Box mb={spacing['4xl']}>
          <SectionTitle>Terminology</SectionTitle>
          <Text
            mb="xl"
            style={{
              fontSize: typography.fontSize.base,
              color: colors.text.secondary,
              lineHeight: typography.lineHeight.relaxed,
            }}
          >
            Use these terms consistently across all PolicyEngine content.
          </Text>

          <Flex direction="column" gap="sm">
            <TermItem term="PolicyEngine" definition="The organization and platform. Capital P, capital E, one word." />
            <TermItem term="microsimulation" definition="One word, no hyphen. The technique for modeling policy effects." />
            <TermItem term="EITC" definition="Earned Income Tax Credit. Spell out on first use." />
            <TermItem term="CTC" definition="Child Tax Credit. Spell out on first use." />
            <TermItem term="UBI" definition="Universal Basic Income. Spell out on first use." />
            <TermItem term="poverty rate" definition="Lowercase. The share of people below the poverty line." />
            <TermItem term="Gini index" definition="Capital G. A measure of income inequality." />
          </Flex>

          <TipBox>
            When in doubt about capitalization, check how the term appears in official
            government sources or academic literature. Acronyms stay uppercase; their
            spelled-out forms follow normal capitalization rules.
          </TipBox>
        </Box>

        {/* Numbers */}
        <Box>
          <SectionTitle>Numbers and formatting</SectionTitle>

          <Box mb="xl">
            <RuleTitle>Numbers</RuleTitle>
            <Flex direction="column" gap="sm">
              <TermItem term="1-9" definition='Spell out: "three states", "five scenarios"' />
              <TermItem term="10+" definition='Use numerals: "50 states", "100 households"' />
              <TermItem term="Large numbers" definition='Use commas: "1,000,000 households" or abbreviate: "1M households"' />
              <TermItem term="Percentages" definition='Use numerals with symbol: "15% reduction"' />
              <TermItem term="Money" definition='Use $ with numerals: "$50 billion", "$1,200/year"' />
            </Flex>
          </Box>

          <Box>
            <RuleTitle>Code references</RuleTitle>
            <RuleDescription>
              Use inline code formatting for variable names, function names, file paths, and API endpoints.
            </RuleDescription>
          </Box>
        </Box>
      </Box>
    </StaticPageLayout>
  );
}
