import { Button, Card, Stack, Text, Title, Box,Group } from '@mantine/core';
import { colors, typography } from '../../../designTokens';

interface Section {
  heading: string;
  body: string | string[];
}

interface TitleCardWithHeaderProps {
  title: string;
  sections?: Section[];
  backgroundColor?: 'white' | 'green' | 'gray';
  buttonLabel: string | string[];
  onButtonClick: (label: string) => void;
}

export const TitleCardWithHeader: React.FC<TitleCardWithHeaderProps> = ({
  title,
  sections = [],
  backgroundColor = 'white',
  buttonLabel,
  onButtonClick,
}) => {

  let resolvedBackgroundColor: string;
  switch (backgroundColor) {
    case 'green':
      resolvedBackgroundColor = colors.primary[500];
      break;
    case 'gray':
      resolvedBackgroundColor = colors.gray[200];
      break;
    case 'white':
    default:
      resolvedBackgroundColor = colors.white;
      break;
  }

  return (
    <Box>
      {/* Title */}
      <Title
        order={1}
        styles={() => ({
          root: {
            color: colors.black,
            fontSize: typography.fontSize['4xl'],
            textAlign: 'left',
            lineHeight: typography.lineHeight.normal,
          },
        })}
      >
        {title}
      </Title>

      {/* Card with content */}
      <Card radius="lg" p="xl" bg={resolvedBackgroundColor}>
    <Stack gap="md">
      {sections.map((section, idx) => (
        <>
          <Title key={`title-${idx}`} order={3} c={colors.blue[700]} lh={1.3} ta="left">
            {section.heading}
          </Title>
          {Array.isArray(section.body) ? (
            section.body.map((para, pIdx) => (
              <Text
                key={`body-${idx}-${pIdx}`}
                size="md"
                c={colors.text.primary}
                lh={1.5}
                ta="left"
                mb="xs"
              >
                {para}
              </Text>
            ))
          ) : (
            <Text key={`body-${idx}`} size="md" c={colors.text.primary} lh={1.5} ta="left">
              {section.body}
            </Text>
          )}
        </>
      ))}

      {/* Buttons */}
          {buttonLabel &&
            (Array.isArray(buttonLabel) ? (
              <Group mt="md" >
                {buttonLabel.map((label, idx) => (
                  <Button
                    key={idx}
                    onClick={() => onButtonClick?.(label)}
                    variant="filled"
                    color={colors.blue[700]}
                  >
                    {label}
                  </Button>
                ))}
              </Group>
            ) : (
              <Button
                onClick={() => onButtonClick?.(buttonLabel)}
                variant="filled"
                color={colors.blue[700]}
                mt="md"
              >
                {buttonLabel}
              </Button>
            ))}
    </Stack>
  </Card>

    </Box>
  );
};

export default function TextCardWithHeaderComponent() {
  return (
    <TitleCardWithHeader
      title=""
      sections={[]} 
      backgroundColor="white" 
      buttonLabel={[]}
      onButtonClick={() => {}}
    />
  );
}