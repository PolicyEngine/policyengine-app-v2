import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Container, Title, Text, Anchor, Center, Stack } from "@mantine/core";
import { colors, spacing } from "@/designTokens";
import { BulletsColumn } from "@/components/columns/BulletsColumn";
import { BulletsValue } from "@/components/columns/types";

const EducationPage = () => {
  const location = useLocation();

  useEffect(() => {
    document.title = "Educational use | PolicyEngine";
    window.scrollTo(0, 0);
  }, [location]);

  const educationalContent: BulletsValue = {
    items: [
      {
        text: "Classroom guides for teaching tax and benefit policies",
      },
      {
        text: "University case studies of PolicyEngine in research and teaching",
      },
      {
        text: "Educational resources for various learning levels",
      },
      {
        text: "Integration with educational curricula",
      },
      {
        text: "Workshop materials and lesson plans",
      },
    ],
  };

  return (
    <Container size="md" py="xl">
      <Center>
        <Stack align="center" gap="xl" maw={800}>
          <Title
            order={1}
            ta="center"
            c={colors.blue[700]}
            size="xl"
          >
            Coming soon
          </Title>
          
          <Text ta="center" size="lg">
            We&apos;re currently developing comprehensive content about how PolicyEngine can be used in educational settings. This page will include:
          </Text>
          
          <BulletsColumn 
            config={{ key: 'educational', header: '', type: 'bullets', items: [] }} 
            value={educationalContent} 
          />
          
          <Text ta="center" size="lg">
            If you&apos;re using PolicyEngine in an educational setting and would like to contribute your story or resources, please contact us at{" "}
            <Anchor href="mailto:hello@policyengine.org" c={colors.blue[700]} td="underline">
              hello@policyengine.org
            </Anchor>
            .
          </Text>
        </Stack>
      </Center>
    </Container>
  );
};

export default EducationPage;