import HeroSection from '@/components/shared/static/HeroSection';
import StaticPageLayout from '@/components/shared/static/StaticPageLayout';
import ContentSection from '@/components/shared/static/ContentSection';
import SupporterCard, { Supporter } from '@/components/shared/static/SupporterCard';
import { SupportedProject } from '@/components/shared/static/SupportedProject';
import { useParams } from 'react-router-dom';
import { Text } from '@mantine/core';

const supporters: Supporter[] = [
  {
    id: 'nuffield',
    name: 'Nuffield Foundation',
    websiteUrl: 'https://www.nuffieldfoundation.org/',
    logoUrl: '/assets/supporters/nuffield.png',
    description: 'an independent charitable trust with a mission to advance educational opportunity and social well-being.',
  },
  {
    id: 'arnold',
    name: 'Arnold Ventures',
    websiteUrl: 'https://www.arnoldventures.org/',
    logoUrl: '/assets/supporters/arnold.svg',
    description: 'a philanthropy dedicated to improving the lives of all Americans through evidence-based policy solutions that maximize opportunity and minimize injustice.',
  },
  {
    id: 'neo',
    name: 'NEO Philanthropy',
    websiteUrl: 'https://neophilanthropy.org/',
    logoUrl: '/assets/supporters/neo.png',
    description: 'a funder intermediary with more than 40 years of experience strengthening social justice movements.',
  },
  {
    id: 'myfriendben',
    name: 'MyFriendBen',
    websiteUrl: 'https://myfriendben.org/',
    logoUrl: '/assets/supporters/myfriendben.webp',
    description: 'a benefit eligibility screener that provides households with a comprehensive understanding of the programs available to them.',
  },
  {
    id: 'huff',
    name: 'Gerald Huff Fund for Humanity',
    websiteUrl: 'https://www.hufffund.org/',
    logoUrl: '/assets/supporters/huff.png',
    description: 'a non-profit organization that was created in 2019 to promulgate the message of Gerald Huff, ardent proponent of Universal Basic Income as a transitional solution to the existential threat of technological unemployment.',
  },
  {
    id: 'corvus',
    name: 'Corvus Oaks Foundation',
    websiteUrl: 'https://corvusoaks.org/',
    description: 'a new private foundation currently exploring several issues for future engagement and collaboration.',
  },
  {
    id: 'institute',
    name: 'The Institute',
    websiteUrl: 'https://www.the-institute.co/',
    logoUrl: '/assets/supporters/institute.svg',
    description: 'a public benefit corporation with a philanthropic mission committed to contributing positively to humanity.',
  },
  {
    id: 'crfb',
    name: 'Committee for a Responsible Federal Budget',
    websiteUrl: 'https://www.crfb.org/',
    logoUrl: '/assets/supporters/crfb.png',
    description: 'a nonpartisan, non-profit organization committed to educating the public on issues with significant fiscal policy impact.',
  },
  {
    id: 'imaginela',
    name: 'Imagine LA',
    websiteUrl: 'https://www.imaginela.org/',
    logoUrl: '/assets/supporters/imaginela.png',
    description: 'a nonprofit dedicated to ending the cycle of family poverty and homelessness.',
  },
  {
    id: 'dylan',
    name: 'Dylan Hirsch-Shell',
    logoUrl: '/assets/supporters/dylan.jpg',
    description: 'a scientist, engineer, and community advocate.',
  },
  {
    id: 'nsf',
    name: 'National Science Foundation',
    websiteUrl: 'https://www.nsf.gov/',
    logoUrl: '/assets/supporters/nsf.png',
    description: 'an independent federal agency supporting science and engineering in all 50 states and U.S. territories through research and education.',
  },
];

const projects: SupportedProject[] = [
  {
    title: 'Enhancing, localising and democratising tax-benefit policy analysis',
    projectUrl: 'https://www.nuffieldfoundation.org/project/enhancing-localising-and-democratising-tax-benefit-policy-analysis',
    amount: 251296,
    currency: 'GBP',
    awardDate: '2024-09',
    description:
      'Supporting the development of expanded program coverage and geographic detail in PolicyEngine UK, as well as a redesigned interface.',
    supporterId: 'nuffield',
  },
  {
    title: 'Labor supply responses',
    projectUrl: 'https://policyengine.org/us/research/us-behavioral-responses',
    amount: 85200,
    currency: 'USD',
    awardDate: '2023-12',
    description:
      'Supporting the development of labor supply responses in PolicyEngine US.',
    supporterId: 'arnold',
  },
  {
    title: 'SALT and AMT policy calculator',
    projectUrl: 'https://policyengine.org/us/research/introducing-salternative',
    amount: 94800,
    currency: 'USD',
    awardDate: '2024-07',
    description:
      'Supporting the development of specialized policy calculators for State and Local Tax (SALT) deductions and Alternative Minimum Tax (AMT) policies.',
    supporterId: 'arnold',
  },
  {
    title: 'State & congressional district policy breakdowns',
    amount: 248525,
    currency: 'USD',
    awardDate: '2025-05',
    description:
      'Supporting the development of detailed policy impact analysis at the state and congressional district levels.',
    supporterId: 'arnold',
  },
  {
    title: 'General operating support (Economic Mobility & Opportunity Fund)',
    projectUrl: 'https://policyengine.org/us/research/neo-philanthropy',
    amount: 200000,
    currency: 'USD',
    awardDate: '2024-10',
    description: 'General operating support.',
    supporterId: 'neo',
  },
  {
    title: 'Benefit eligibility API',
    amount: 300000,
    currency: 'USD',
    awardDate: '2024-10',
    description:
      'Supporting the development and maintenance of the PolicyEngine rules engine and API, powering state and federal programs in MyFriendBen.',
    supporterId: 'myfriendben',
  },
  {
    title: 'Premium tax credit modeling',
    amount: 25000,
    currency: 'USD',
    awardDate: '2025-01',
    description: 'Supporting the addition of Affordable Care Act premium tax credit rules to the PolicyEngine API.',
    supporterId: 'myfriendben',
  },
  {
    title: 'General operating support',
    amount: 50000,
    currency: 'USD',
    awardDate: '2024-08',
    description: 'Supporting our ability to grow technological capacity, integrate AI more fully, build organizational strength, and increase sustainability.',
    supporterId: 'huff',
  },
  {
    title: 'General operating support',
    amount: 50000,
    currency: 'USD',
    awardDate: '2023-08',
    description: 'Supporting the improvement and marketing of the software as we pursue longer-term funding strategies.',
    supporterId: 'huff',
  },
  {
    title: 'Travel support',
    amount: 25000,
    currency: 'USD',
    awardDate: '2024-09',
    description: 'Supporting our ability to connect with the benefit access community through travel and events.',
    supporterId: 'corvus',
  },
  {
    title: 'Universal basic income simulation',
    amount: 35000,
    currency: 'USD',
    awardDate: '2023-07',
    description: 'Supporting the development of a report simulating options for budget-neutral tax-benefit reforms creating a universal basic income in the US.',
    supporterId: 'institute',
  },
  {
    title: 'Analysis of reforms to the taxation of Social Security benefits',
    amount: 35000,
    currency: 'USD',
    awardDate: '2025-01',
    description:
      'Supporting a microsimulation analysis of various reforms to federal taxation of Social Security benefits.',
    supporterId: 'crfb',
  },
  {
    title: 'API support for Benefit Navigator',
    amount: 97000,
    currency: 'USD',
    awardDate: '2023-07',
    description:
      'Supporting the development of new policy rules and benefit eligibility API service for Benefit Navigator.',
    supporterId: 'imaginela',
  },
  {
    title: 'General operating support',
    amount: 30000,
    currency: 'USD',
    awardDate: '2022-12',
    description: 'Supporting the development of a calibrated dataset for accurate tax-benefit microsimulation.',
    supporterId: 'dylan',
  },
  {
    title: 'Pathways to Enable Open-Source Ecosystems (POSE) Phase I',
    projectUrl: 'https://www.nsf.gov/awardsearch/showAward?AWD_ID=2229642',
    amount: 300000,
    currency: 'USD',
    awardDate: '2025-08',
    description:
      'Supporting the development of organizational infrastructure and community engagement to strengthen the open-source ecosystem around economic policy analysis tools.',
    supporterId: 'nsf',
  },
];

// Utility to convert amounts to USD for sorting
const GBP_TO_USD = 1.33;

function toUSD(amount: number, currency: 'USD' | 'GBP'): number {
  return currency === 'GBP' ? amount * GBP_TO_USD : amount;
}

// Calculate total funding per supporter and sort
const supportersWithTotals = supporters.map((supporter) => {
  const supporterProjects = projects.filter((p) => p.supporterId === supporter.id);

  // Sort projects by date descending (newest first)
  supporterProjects.sort((a, b) => b.awardDate.localeCompare(a.awardDate));

  const total = supporterProjects.reduce((sum, project) => {
    return sum + toUSD(project.amount, project.currency);
  }, 0);

  return { supporter, projects: supporterProjects, total };
});

// Sort supporters by total funding descending (in USD)
supportersWithTotals.sort((a, b) => b.total - a.total);

export default function SupportersPage() {
  const { countryId } = useParams<{ countryId: string }>();
  const organisationsText = countryId === 'uk' ? 'organisations' : 'organizations';

  return (
    <StaticPageLayout title="Supporters">
      <HeroSection
        title="Our supporters"
        description={
          <Text component="span">
            PolicyEngine gratefully acknowledges the {organisationsText} and individuals whose{' '}
            <strong>grants, contracts, and donations</strong> make our work possible.
          </Text>
        }
      />

      <ContentSection>
        {supportersWithTotals.map(({ supporter, projects: supporterProjects }) => (
          <SupporterCard key={supporter.id} supporter={supporter} projects={supporterProjects} />
        ))}
      </ContentSection>
    </StaticPageLayout>
  );
}
