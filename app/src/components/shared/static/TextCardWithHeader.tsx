import { Box, Button, Card, Group, Stack, Text, Title } from '@mantine/core';
import { colors } from '../../../designTokens';

interface Section {
  heading?: string;
  body: string | string[];
}

interface TitleCardWithHeaderProps {
  title: string;
  sections: Section[];
  backgroundColor?: 'white' | 'green' | 'gray';
  buttonLabel?: string | string[];
  onButtonClick?: (label: string) => void;
}

export const TitleCardWithHeader: React.FC<TitleCardWithHeaderProps> = ({
  title,
  sections = [],
  backgroundColor = 'white',
  buttonLabel,
  onButtonClick,
}) => {
  let resolvedBackgroundColor: string;
  let textColor: string;
  switch (backgroundColor) {
    case 'green':
      resolvedBackgroundColor = colors.primary[500];
      textColor = colors.text.inverse;
      break;
    case 'gray':
      resolvedBackgroundColor = colors.gray[200];
      textColor = colors.text.primary;
      break;
    case 'white':
    default:
      resolvedBackgroundColor = colors.white;
      textColor = colors.text.primary;
      break;
  }

  return (
    <Box>
      {/* Title */}
      <Title order={2} variant="colored">
        {title}
      </Title>

      {/* Card with content */}
      <Card radius="lg" p="xl" bg={resolvedBackgroundColor}>
        <Stack gap="md">
          {sections.map((section, idx) => (
            <>
              <Title key={`title-${idx}`} order={3} variant="colored" ta="left">
                {section.heading}
              </Title>
              {Array.isArray(section.body) ? (
                section.body.map((para, pIdx) => (
                  <Text
                    key={`body-${idx}-${pIdx}`}
                    size="md"
                    c={textColor}
                    lh={1.5}
                    ta="left"
                    mb="xs"
                  >
                    {para}
                  </Text>
                ))
              ) : (
                <Text key={`body-${idx}`} size="md" c={textColor} lh={1.5} ta="left">
                  {section.body}
                </Text>
              )}
            </>
          ))}

          {/* Buttons */}
          {buttonLabel &&
            (Array.isArray(buttonLabel) ? (
              <Group mt="md">
                {buttonLabel.map((label, idx) => (
                  <Button key={idx} onClick={() => onButtonClick?.(label)} variant="default">
                    {label}
                  </Button>
                ))}
              </Group>
            ) : (
              <Button onClick={() => onButtonClick?.(buttonLabel)} variant="default" mt="md">
                {buttonLabel}
              </Button>
            ))}
        </Stack>
      </Card>
    </Box>
  );
};
