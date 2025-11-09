import { useNavigate, useParams } from 'react-router-dom';
import { Box, Container, List, Text, Title } from '@mantine/core';
import CalloutWithImage from '@/components/shared/static/CalloutWithImage';
import { CardsWithHeader } from '@/components/shared/static/CardsWithHeader';
import HeroSection from '@/components/shared/static/HeroSection';
import StaticPageLayout from '@/components/shared/static/StaticPageLayout';
import { TitleCardWithHeader } from '@/components/shared/static/TextCardWithHeader';
import TwoColumnView from '@/components/TwoColumnView';
import heroImage from '@/images/posts/how-machine-learning-tools-make-policyengine-more-accurate.png';

export default function MicrosimPage() {
  const navigate = useNavigate();
  const { countryId } = useParams<{ countryId: string }>();
  const isUK = countryId?.toLowerCase() === 'uk';
  const optimize = isUK ? 'optimise' : 'optimize';
  const analyze = isUK ? 'analyse' : 'analyze';
  const modeling = isUK ? 'modelling' : 'modeling';

  return (
    <StaticPageLayout title="Microsimulation">
      <HeroSection
        title="Microsimulation"
        description="How PolicyEngine's tax and benefit models work"
      />
      <Container size="l">
        <Box mt="3xl">
          <CalloutWithImage
            title="Tax-Benefit Microsimulation"
            description={`PolicyEngine uses microsimulation models to ${analyze} the impact of policy reforms on real households`}
            buttonLabel="TRY POLICY ANALYSIS"
            onButtonClick={() => countryId && navigate(`/${countryId}/policies`)}
            imageSrc={heroImage}
            imageAlt="Diagram showing PolicyEngine microsimulation"
          />
        </Box>

        <Box p="xl" mt="3xl">
          <TitleCardWithHeader
            title="What is Microsimulation?"
            sections={[
              {
                body: (
                  <>
                    <Text>
                      Microsimulation is a computational technique used to estimate the effects of
                      policy changes on individuals, households, or other microeconomic units.
                      Unlike macroeconomic models that focus on aggregate variables, microsimulation
                      models:
                    </Text>

                    <List spacing="xs" mt="sm" withPadding>
                      <List.Item>
                        Apply tax and benefit rules to representative samples of the population
                      </List.Item>
                      <List.Item>
                        Calculate outcomes for each household based on their unique characteristics
                      </List.Item>
                      <List.Item>Aggregate results to estimate population-wide impacts</List.Item>
                      <List.Item>
                        Allow for detailed distributional analysis by income, demographic groups,
                        and more
                      </List.Item>
                    </List>

                    <Text mt="sm">
                      PolicyEngine’s microsimulation models implement tax and benefit systems as
                      code, allowing users to modify parameters and see how changes affect different
                      households and the overall population.
                    </Text>
                  </>
                ),
              },
            ]}
          />
        </Box>

        <Box mt="3xl">
          <TwoColumnView
            title="How PolicyEngine's models work"
            backgroundColor="secondary"
            leftColumn={
              <>
                <Title order={3} mt="md">
                  Open-Source Foundation
                </Title>
                <Text mt="xs">
                  PolicyEngine builds on OpenFisca, an open-source microsimulation framework
                  developed by the French government. Our models implement tax and benefit rules as
                  code, creating a computational representation of current policy and allowing for
                  modifications to explore reform impacts.
                </Text>

                <Title order={3} mt="xl">
                  Data-Driven Approach
                </Title>
                <Text mt="xs">
                  Our models use nationally representative household surveys enhanced with
                  administrative data to create accurate population samples:
                </Text>
                <List spacing="xs" mt="sm" withPadding>
                  <List.Item>
                    <b>UK:</b> Family Resources Survey with custom survey weights
                  </List.Item>
                  <List.Item>
                    <b>US:</b> Enhanced Current Population Survey with synthetic tax records
                  </List.Item>
                </List>

                <Title order={3} mt="xl">
                  Machine Learning Enhancement
                </Title>
                <Text mt="xs">
                  We apply machine learning techniques to {optimize} our population samples:
                </Text>
                <List spacing="xs" mt="sm" withPadding>
                  <List.Item>
                    Gradient descent algorithms to calibrate survey weights to match administrative
                    totals
                  </List.Item>
                  <List.Item>
                    Quantile regression forests to synthesize missing tax information for US data
                  </List.Item>
                  <List.Item>Statistical validation against administrative benchmarks</List.Item>
                </List>
              </>
            }
            rightColumn={
              <img
                src={heroImage}
                alt="Relative aggregate error chart"
                style={{
                  width: '100%',
                  borderRadius: '12px',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
                }}
              />
            }
          />
        </Box>

        <Box p="xl" mt="3xl">
          <TitleCardWithHeader
            title="Model Accuracy and Validation"
            sections={[
              {
                body: (
                  <>
                    <Text>
                      PolicyEngine continuously validates our models against administrative data to
                      ensure accuracy:
                    </Text>

                    <List spacing="xs" mt="sm" withPadding>
                      <List.Item>
                        Aggregate tax and benefit totals compared to government budget figures
                      </List.Item>
                      <List.Item>
                        Distributional impacts validated against administrative statistics
                      </List.Item>
                      <List.Item>
                        Tax and benefit calculators tested against official examples
                      </List.Item>
                      <List.Item>
                        Ongoing calibration to match the latest data from government sources
                      </List.Item>
                    </List>

                    <Text mt="sm">
                      Our UK model has achieved up to 80% lower aggregate error rates compared to
                      standard survey-based approaches, and our US Enhanced CPS represents a
                      significant improvement over public microdata for tax {modeling}.
                    </Text>
                  </>
                ),
              },
            ]}
          />
        </Box>

        <Box mt="3xl">
          <CardsWithHeader
            containerTitle="Technical Documentation"
            cards={[
              {
                title: 'US Model Documentation',
                description:
                  'Technical details about the US Enhanced Current Population Survey (ECPS), tax and benefit calculators, and validation methodology.',
                footerText: 'Enhanced CPS Documentation →',
                onClick: ((e: React.MouseEvent | undefined) => {
                  e?.stopPropagation();
                  window.open(
                    `/${countryId}/research/enhanced-cps-beta`,
                    '_blank',
                    'noopener,noreferrer'
                  );
                }) as unknown as () => void,
                background: 'gray',
              },
              {
                title: 'UK Model Validation',
                description:
                  'Detailed information about the UK tax and benefit model, including data sources, calibration methodology, and validation results.',
                footerText: 'UK Model Validation →',
                onClick: ((e: React.MouseEvent | undefined) => {
                  e?.stopPropagation();
                  window.open(
                    `/${countryId}/research/uk-spi-validation`,
                    '_blank',
                    'noopener,noreferrer'
                  );
                }) as unknown as () => void,
                background: 'gray',
              },
              {
                title: 'GitHub Repositories',
                description:
                  'Access our open-source code repositories for all PolicyEngine models, including tax-benefit rules, data processing pipelines, and web interface.',
                footerText: 'PolicyEngine on GitHub →',
                onClick: ((e: React.MouseEvent | undefined) => {
                  e?.stopPropagation();
                  window.open('https://github.com/PolicyEngine', '_blank', 'noopener,noreferrer');
                }) as unknown as () => void,
                background: 'gray',
              },
            ]}
          />
        </Box>
      </Container>
    </StaticPageLayout>
  );
}
