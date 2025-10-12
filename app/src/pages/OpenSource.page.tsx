import { Stack, Text } from '@mantine/core';
import PageHeader from '@/components/shared/static/PageHeader';
import { TitleCardWithHeader } from '@/components/shared/static/TextCardWithHeader';

export default function OpenSourcePage() {
  return (
    <Stack gap="lg">
      <PageHeader
        title="Open source"
        description="PolicyEngine's commitment to open source software and transparent policy analysis"
      />
      
      <TitleCardWithHeader
        title="Coming soon"
        sections={[
          {
            body: (
              <>
                <Text>
                  We're currently developing comprehensive content about PolicyEngine's open source
                  software and our commitment to transparency. This page will include:
                </Text>

                <ul style={{ marginTop: '1rem', paddingLeft: '1.5rem' }}>
                  <li>Overview of our open source repositories and software architecture</li>
                  <li>Contributor guidelines and how to get involved</li>
                  <li>Our open source philosophy and commitment to transparency</li>
                  <li>Case studies of community contributions</li>
                  <li>Development roadmap and future plans</li>
                </ul>
              </>
            ),
          },
        ]}
      />
    </Stack>
  );
}
