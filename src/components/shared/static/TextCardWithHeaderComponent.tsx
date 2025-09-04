// import React from "react";
import { Card, Title, Text, Flex, Stack, Button } from "@mantine/core";
import { colors } from "../../../designTokens/colors";
import { typography } from "@/designTokens";

interface Section {
  heading: string;
  body: string | string[];
  
}

interface TitleCardWithHeaderProps {
  title: string;
  sections?: Section[];
  grayBackground?: boolean; 
  buttonLabel : string;
  onButtonClick : () => void;
}

export const TitleCardWithHeader: React.FC<TitleCardWithHeaderProps> = ({
  title,
  sections = [],
  grayBackground = false,
  buttonLabel,
  onButtonClick,
}) => {
  return (
    
      // direction="column"
       <div>
      {/* Main Title */}
      <Title
        order={1}
        styles={() => ({
          root: {
            color: colors.black,
            fontSize: typography.fontSize['4xl'],
            textAlign: "left",
            lineHeight: typography.lineHeight.normal,
          },
        })}
      >
        {title}
      </Title>

      {/* Card with content */}
      <Card shadow="sm" radius="lg" p="xl" bg={grayBackground ? colors.gray[100] : "white"}>
        <Stack gap="md">
          {sections.map((section, idx) => (
            <div key={idx}>
              <Title order={3} c={colors.blue[700]} lh={1.3} ta="left">
                {section.heading}
              </Title>
              {Array.isArray(section.body) ? (
                section.body.map((para, pIdx) => (
                  <Text key={pIdx} size="md" c={colors.text.primary} lh={1.5} ta="left" mb="xs">
                    {para}
                  </Text>
                ))
              ) : (
                <Text size="md" c={colors.text.primary} lh={1.5} ta="left">
                  {section.body}
                </Text>
              )}
            </div>
          ))}

          {buttonLabel && (
            <Button
              onClick={onButtonClick}
              variant="filled"
              color="blue"
              mt="md"
              style={{ alignSelf: "flex-start" }}
            >
              {buttonLabel}
            </Button>
          )}
        </Stack>
      </Card>
    </div>
  );
};

    


export default function TextCardWithHeaderComponent() {
  return <TitleCardWithHeader title={""} buttonLabel={""} onButtonClick={function (): void {
    throw new Error("Function not implemented.");
  } } />;
}
