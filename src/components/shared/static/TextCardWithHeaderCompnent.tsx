import React from "react";
import { Card, Title, Text, Flex } from "@mantine/core";
import { colors } from "../../../designTokens/colors";

interface Section {
  heading: string;
  body: string | string[];
}

interface TitleCardWithHeaderProps {
  title: string;
  sections?: Section[];
}

export const TitleCardWithHeader: React.FC<TitleCardWithHeaderProps> = ({
  title,
  sections = [],
}) => {
  return (
    <Flex
      direction="column"
      gap="xl"
      style={{
        width: "100%",
        maxWidth: 900,
        margin: "0 auto",
        padding: 16, // accessible fixed padding in px
      }}
    >
      {/* Main Title */}
      <Title
        order={1}
        styles={() => ({
          root: {
            color: colors.text.primary,
            fontSize: 40,
            textAlign: "left", // left-aligned across all breakpoints
            lineHeight: 1.2,
          },
        })}
      >
        {title}
      </Title>

      {/* Wrapper Card */}
      <Card
        shadow="sm"
        radius="lg"
        p="xl" // Mantine spacing token for consistent accessible padding
        styles={() => ({
          root: {
            backgroundColor: colors.gray[100],
          },
        })}
      >
        <Flex direction="column" gap="md">
          {sections.map((section, idx) => (
            <Flex key={idx} direction="column" gap={8}>
              {/* Section Heading */}
              <Title
                order={3}
                styles={() => ({
                  root: {
                    color: colors.blue[700],
                    lineHeight: 1.3,
                    textAlign: "left", // left-aligned
                  },
                })}
              >
                {section.heading}
              </Title>

              {/* Section Body */}
              {Array.isArray(section.body)
                ? section.body.map((para, pIdx) => (
                    <Text
                      key={pIdx}
                      size="md"
                      styles={() => ({
                        root: { color: colors.text.primary, lineHeight: 1.5, textAlign: "left" },
                      })}
                    >
                      {para}
                    </Text>
                  ))
                : (
                    <Text
                      size="md"
                      styles={() => ({
                        root: { color: colors.text.primary, lineHeight: 1.5, textAlign: "left" },
                      })}
                    >
                      {section.body}
                    </Text>
                  )}
            </Flex>
          ))}
        </Flex>
      </Card>
    </Flex>
  );
};

export default TitleCardWithHeader;