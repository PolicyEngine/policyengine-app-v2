import { useSelector } from 'react-redux';
import { Anchor, Code, List, Stack, Text, Title } from '@mantine/core';
import APIPlayground from '@/components/shared/static/APIPlayground';
import CodeBlock from '@/components/shared/static/CodeBlock';
import ContentSection from '@/components/shared/static/ContentSection';
import CTASection from '@/components/shared/static/CTASection';
import HeroSection from '@/components/shared/static/HeroSection';
import StaticPageLayout from '@/components/shared/static/StaticPageLayout';
import VariableParameterExplorer from '@/components/shared/static/VariableParameterExplorer';
import {
  getCalculateRequestCode,
  TOKEN_FETCH_CODE,
  TOKEN_RESPONSE_CODE,
} from '@/constants/apiExamples';
import { spacing } from '@/designTokens';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';
import type { RootState } from '@/store';

export default function APIPage() {
  const countryId = useCurrentCountry();
  const metadata = useSelector((state: RootState) => state.metadata);

  // Sample API response for demonstration
  const sampleResponse = {
    status: 'ok',
    result: {
      households: {
        household: {
          household_net_income: {
            '2023': 18500,
          },
        },
      },
      people: {
        parent: {
          employment_income: {
            '2023': 20000,
          },
          income_tax: {
            '2023': 1500,
          },
        },
        child: {
          age: {
            '2023': 5,
          },
        },
      },
    },
  };

  return (
    <StaticPageLayout title="API Documentation">
      <HeroSection
        title="PolicyEngine REST API"
        description="Build tax and benefit policy analysis into your applications with our comprehensive API"
      />

      <CTASection
        title="Getting Started"
        variant="primary"
        content={
          <Stack gap={spacing.md}>
            <Text>
              PolicyEngine's REST API (
              <Anchor
                href="https://household.api.policyengine.org"
                target="_blank"
                rel="noopener noreferrer"
              >
                https://household.api.policyengine.org
              </Anchor>
              ) simulates tax-benefit policy outcomes and reform impacts for households. Access
              requires a{' '}
              <Text component="span" fw={700}>
                Client ID
              </Text>{' '}
              and{' '}
              <Text component="span" fw={700}>
                Client Secret
              </Text>{' '}
              provided by PolicyEngine. For access, contact us at{' '}
              <Anchor href="mailto:hello@policyengine.org">hello@policyengine.org</Anchor>.
            </Text>
            <Title order={4} mt={spacing.md}>
              On this page:
            </Title>
            <List>
              <List.Item>
                <Anchor href="#fetch-token">Fetch an authentication token</Anchor>
              </List.Item>
              <List.Item>
                <Anchor href="#calculate">Calculate household-level policy outcomes</Anchor>
              </List.Item>
              <List.Item>
                <Anchor href="#variables">Variable and parameter metadata</Anchor>
              </List.Item>
              <List.Item>
                <Anchor href="#playground">API playground</Anchor>
              </List.Item>
            </List>
          </Stack>
        }
        cta={{
          text: 'Try API Playground',
          href: '#playground',
          target: '_self',
        }}
      />

      <ContentSection id="fetch-token" title="Fetch an authentication token" variant="secondary">
        <Text mb={spacing.lg}>
          Execute a credentials exchange using your client ID and client secret to obtain an
          authentication token. Include this token in the authorization header of every request as
          "Bearer YOUR_TOKEN". Tokens expire monthly for security.
        </Text>
        <Stack gap={spacing.lg}>
          <CodeBlock code={TOKEN_FETCH_CODE} language="python" title="Request" />
          <CodeBlock code={TOKEN_RESPONSE_CODE} language="json" title="Response" />
        </Stack>
      </ContentSection>

      <ContentSection
        id="calculate"
        title="Calculate household-level policy outcomes"
        variant="primary"
      >
        <Stack gap={spacing.md}>
          <Text>
            Returns household-level policy outcomes. Pass in a household object defining people,
            groups and any variable values. Use null values for requested variables - these will be
            computed and returned.
          </Text>
          <Title order={5}>
            <Code>POST /{countryId}/calculate</Code>
          </Title>
        </Stack>
        <Stack gap={spacing.lg} mt={spacing.lg}>
          <CodeBlock code={getCalculateRequestCode(countryId)} language="python" title="Request" />
          <CodeBlock
            code={JSON.stringify(sampleResponse, null, 2)}
            language="json"
            title="Response"
          />
        </Stack>
      </ContentSection>

      <ContentSection id="variables" title="Variable and parameter metadata" variant="secondary">
        <Stack gap={spacing.md}>
          <Text>
            Access information about all available variables and parameters in the PolicyEngine API.
          </Text>
          <Title order={5}>
            <Code>GET /{countryId}/metadata</Code>
          </Title>
        </Stack>
        {metadata && <VariableParameterExplorer metadata={metadata} />}
      </ContentSection>

      <ContentSection id="playground" title="API Playground" variant="accent">
        <Text c="white" mb={spacing.lg}>
          Try out the API in this interactive demo.
        </Text>
        <APIPlayground countryId={countryId} />
      </ContentSection>
    </StaticPageLayout>
  );
}
