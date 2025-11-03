import { useSelector } from 'react-redux';
import { Code, SimpleGrid, Title } from '@mantine/core';
import APIPlayground from '@/components/shared/static/APIPlayground';
import CodeBlock from '@/components/shared/static/CodeBlock';
import ContentSection from '@/components/shared/static/ContentSection';
import CTASection from '@/components/shared/static/CTASection';
import HeroSection from '@/components/shared/static/HeroSection';
import RichTextBlock from '@/components/shared/static/RichTextBlock';
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
          <RichTextBlock>
            <p>
              PolicyEngine's REST API (
              <a
                href="https://household.api.policyengine.org"
                target="_blank"
                rel="noopener noreferrer"
              >
                https://household.api.policyengine.org
              </a>
              ) simulates tax-benefit policy outcomes and reform impacts for households. Access
              requires a <strong>Client ID</strong> and <strong>Client Secret</strong> provided by
              PolicyEngine. For access, contact us at{' '}
              <a href="mailto:hello@policyengine.org">hello@policyengine.org</a>.
            </p>
            <p>
              <strong>On this page:</strong>
            </p>
            <ul>
              <li>
                <a href="#fetch-token">Fetch an authentication token</a>
              </li>
              <li>
                <a href="#calculate">Calculate household-level policy outcomes</a>
              </li>
              <li>
                <a href="#variables">Variable and parameter metadata</a>
              </li>
              <li>
                <a href="#playground">API playground</a>
              </li>
            </ul>
          </RichTextBlock>
        }
        cta={{
          text: 'Try API Playground',
          href: '#playground',
          target: '_self',
        }}
      />

      <ContentSection id="fetch-token" title="Fetch an authentication token" variant="secondary">
        <RichTextBlock>
          <p>
            Execute a credentials exchange using your client ID and client secret to obtain an
            authentication token. Include this token in the authorization header of every request as
            "Bearer YOUR_TOKEN". Tokens expire monthly for security.
          </p>
        </RichTextBlock>
        <SimpleGrid cols={{ base: 1, md: 2 }} spacing={spacing.lg} mt={spacing.lg}>
          <CodeBlock code={TOKEN_FETCH_CODE} language="python" title="Request" />
          <CodeBlock code={TOKEN_RESPONSE_CODE} language="json" title="Response" />
        </SimpleGrid>
      </ContentSection>

      <ContentSection
        id="calculate"
        title="Calculate household-level policy outcomes"
        variant="primary"
      >
        <RichTextBlock>
          <p>
            Returns household-level policy outcomes. Pass in a household object defining people,
            groups and any variable values. Use null values for requested variables - these will be
            computed and returned.
          </p>
        </RichTextBlock>
        <Title order={5} mt={spacing.md}>
          <Code>POST /{countryId}/calculate</Code>
        </Title>
        <SimpleGrid cols={{ base: 1, md: 2 }} spacing={spacing.lg} mt={spacing.lg}>
          <CodeBlock code={getCalculateRequestCode(countryId)} language="python" title="Request" />
          <CodeBlock
            code={JSON.stringify(sampleResponse, null, 2)}
            language="json"
            title="Response"
          />
        </SimpleGrid>
      </ContentSection>

      <ContentSection id="variables" title="Variable and parameter metadata" variant="secondary">
        <RichTextBlock>
          <p>
            Access information about all available variables and parameters in the PolicyEngine API.
          </p>
        </RichTextBlock>
        <Title order={5} mt={spacing.md}>
          <Code>GET /{countryId}/metadata</Code>
        </Title>
        {metadata && <VariableParameterExplorer metadata={metadata} />}
      </ContentSection>

      <ContentSection id="playground" title="API Playground" variant="accent">
        <RichTextBlock variant="inverted">
          <p>Try out the API in this interactive demo.</p>
        </RichTextBlock>
        <APIPlayground countryId={countryId} />
      </ContentSection>
    </StaticPageLayout>
  );
}
