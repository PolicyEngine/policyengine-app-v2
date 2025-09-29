// TEMPORARY TEST PAGE - Remove after testing
import { Stack } from '@mantine/core';
import { TitleCardWithHeader } from '@/components/shared/static/TextCardWithHeader';

export default function TextCardTestPage() {
  return (
    <Stack gap="xl" p="xl">
      <h1>TextCardWithHeader Component Test Page (TEMPORARY)</h1>

      <TitleCardWithHeader
        title="White Background Example"
        sections={[
          {
            heading: "Section 1",
            body: "This is an example with white background color."
          },
          {
            heading: "Section 2",
            body: ["Paragraph 1 with white background.", "Paragraph 2 with white background."]
          }
        ]}
        backgroundColor="white"
        buttonLabel={["Button 1", "Button 2"]}
        onButtonClick={(label) => console.log(`Clicked: ${label}`)}
      />

      <TitleCardWithHeader
        title="Green Background Example"
        sections={[
          {
            heading: "Section 1",
            body: "This is an example with green background color."
          },
          {
            heading: "Section 2",
            body: ["Paragraph 1 with green background.", "Paragraph 2 with green background."]
          }
        ]}
        backgroundColor="green"
        buttonLabel="Single Button"
        onButtonClick={(label) => console.log(`Clicked: ${label}`)}
      />

      <TitleCardWithHeader
        title="Gray Background Example"
        sections={[
          {
            heading: "Section 1",
            body: "This is an example with gray background color."
          },
          {
            heading: "Section 2",
            body: ["Paragraph 1 with gray background.", "Paragraph 2 with gray background."]
          }
        ]}
        backgroundColor="gray"
        buttonLabel={["Action 1", "Action 2", "Action 3"]}
        onButtonClick={(label) => console.log(`Clicked: ${label}`)}
      />
    </Stack>
  );
}