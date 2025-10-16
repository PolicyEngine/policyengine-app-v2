import { Divider, Space } from '@mantine/core';
import { CardsWithHeader } from '@/components/shared/static/CardsWithHeader';
import PageHeader from '@/components/shared/static/PageHeader';
import { TitleCardWithHeader } from '@/components/shared/static/TextCardWithHeader';
import { colors } from '@/designTokens/colors';
import benefit_nav_Icon from '@/images/logos/orgs/benefit_navigator.png';
import myfriendbenIcon from '@/images/logos/orgs/myfriendben.png';
import navvy_Icon from '@/images/logos/orgs/SBNC.png';

export default function BenefitAccessPage() {
  const handleButtonClick = (label: string) => {
    switch (label) {
      case 'Explore our API':
        window.open('https://policyengine.org/us/api', '_blank');
        break;
      case 'Contact us':
        window.location.href = 'mailto:hello@policyengine.org';
        break;
      default:
        console.log('Unknown button clicked');
    }
  };
  return (
    <>
      <PageHeader
        title="Benefit Access"
        description="Powering benefit eligibility screening tools through the PolicyEngine API"
      />
      <Space mb={20} /> {}
      <TitleCardWithHeader
        title="Increasing access to public benefits"
        sections={[
          {
            body: (
              <>
                <p>
                  PolicyEngine's tax-benefit engine and API power a range of benefit eligibility
                  screening tools, helping people discover and access the support they're entitled
                  to.
                </p>

                <p>
                  Our partners leverage PolicyEngine's computational capabilities to create
                  user-friendly applications that simplify the complex landscape of public benefits
                  programs, making it easier for individuals, families, and case workers to identify
                  available assistance.
                </p>
              </>
            ),
          },
        ]}
      />
      <Divider orientation="horizontal" size="xs" color={colors.border.dark} mt={60} mb={40} />
      <CardsWithHeader
        cards={[
          {
            title: 'MyFriendBen',
            description:
              'An open-source multi-benefit screener operating in Colorado, currently expanding to North Carolina and Massachusetts. MyFriendBen helps individuals quickly identify benefits they may qualify for through an accessible, user-friendly interface.',
            image:
              'https://www.myfriendben.org/wp-content/uploads/2024/08/MFB-National-Site-Triple-Phone-1024x844.png',
            icon: (
              <img src={myfriendbenIcon} alt="MyFriendBen" style={{ width: 130, height: 30 }} />
            ),
            footerText: 'Visit Website →',
            tags: ['Colorado', 'North Carolina', 'Massachusetts'],
          },
          {
            title: 'Benefit Navigator',
            description:
              'A tool developed by IMAGINE LA to support case workers in Los Angeles County. Benefit Navigator helps social service providers quickly assess client eligibility for multiple benefit programs, streamlining the assistance process.',
            image:
              'https://images.squarespace-cdn.com/content/v1/5f6287b7ba52c722644c43c2/0938452b-fc33-483a-be9c-bc6ae1f98191/Screen+1.png?format=1500w',
            footerText: 'Visit Website →',
            icon: (
              <img
                src={benefit_nav_Icon}
                alt="Benefit Navigator"
                style={{ width: 130, height: 40 }}
              />
            ),
            tags: ['Los Angeles County'],
          },
          {
            title: 'Navvy',
            description:
              'A benefits screener developed by Impactica for the Student Basic Needs Coalition. Navvy helps students identify and access critical support services and benefits specifically designed for higher education students.',
            image:
              'https://static.wixstatic.com/media/bc112d_b0a5a365b2ec4fa587724e776fa99934~mv2.png/v1/crop/x_0,y_10,w_1436,h_1322/fill/w_832,h_766,al_c,q_90,usm_0.66_1.00_0.01,enc_avif,quality_auto/unnamed-2_edited.png',
            footerText: 'Visit Website →',
            icon: <img src={navvy_Icon} alt="Navvy" style={{ width: 130, height: 30 }} />,
            tags: ['National (US)'],
          },
        ]}
        containerTitle=""
      />
      <Divider orientation="horizontal" size="xs" color={colors.border.dark} mt={60} mb={40} />
      <TitleCardWithHeader
        title="Build your own benefit screening tool"
        sections={[
          {
            body: (
              <>
                <p>
                  Are you interested in creating a benefit screening tool for your organization or
                  community?
                </p>

                <p>
                  PolicyEngine's API provides accurate, up-to-date benefit calculations that can be
                  integrated into your own applications.
                </p>

                <p>Our API offers:</p>
                <ul>
                  <li>
                    Calculation of eligibility and benefit amounts for major US and UK tax and
                    benefit programs
                  </li>
                  <li>Flexible integration options to fit your organization's needs</li>
                  <li>Regularly updated policy parameters to reflect current legislation</li>
                  <li>Technical support from our team</li>
                </ul>
              </>
            ),
          },
        ]}
        buttonLabel={['Explore our API', 'Contact us']}
        onButtonClick={handleButtonClick}
      />
    </>
  );
}
