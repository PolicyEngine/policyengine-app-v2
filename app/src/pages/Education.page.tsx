import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Container, Title, Text, List, Anchor, Box, Stack } from "@mantine/core";
import { colors, spacing, typography } from "@/designTokens";

const EducationPage = () => {
  const location = useLocation();

  useEffect(() => {
    document.title = "Educational use | PolicyEngine";
    window.scrollTo(0, 0);
  }, [location]);

  return (
    <>
      <Container size="md" py="xl">
        <Box
          style={{
            maxWidth: "800px",
            margin: "0 auto",
            textAlign: "center",
            padding: "3rem 1rem",
          }}
        >
          <Title
            order={2}
            ta="center"
            mb="lg"
            style={{
              color: colors.blue[700], 
              marginBottom: "1.5rem",
            }}
          >
            Coming soon
          </Title>
          
          <Text ta="center" size="lg" mb="lg">
            We&apos;re currently developing comprehensive content about how
            PolicyEngine can be used in educational settings. This page will
            include:
          </Text>
          
          <Box
            style={{
              textAlign: "left",
              display: "inline-block",
              margin: "1.5rem auto",
            }}
          >
            <List spacing="sm" size="lg">
              <List.Item style={{ marginBottom: "0.5rem" }}>
                Classroom guides for teaching tax and benefit policies
              </List.Item>
              <List.Item style={{ marginBottom: "0.5rem" }}>
                University case studies of PolicyEngine in research and teaching
              </List.Item>
              <List.Item style={{ marginBottom: "0.5rem" }}>
                Educational resources for various learning levels
              </List.Item>
              <List.Item style={{ marginBottom: "0.5rem" }}>
                Integration with educational curricula
              </List.Item>
              <List.Item style={{ marginBottom: "0.5rem" }}>
                Workshop materials and lesson plans
              </List.Item>
            </List>
          </Box>
          
          <Text ta="center" size="lg">
            If you&apos;re using PolicyEngine in an educational setting and
            would like to contribute your story or resources, please contact us
            at{" "}
            <Anchor href="mailto:hello@policyengine.org">
              hello@policyengine.org
            </Anchor>
            .
          </Text>
        </Box>
      </Container>
    </>
  );
};

export default EducationPage;