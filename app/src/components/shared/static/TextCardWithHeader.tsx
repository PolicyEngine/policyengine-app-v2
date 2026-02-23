import React from 'react';
import { Button, Card, CardContent, Group, Stack, Text, Title } from '@/components/ui';
import { colors } from '@/designTokens';

interface Section {
  heading?: string;
  body: string | string[] | React.ReactNode | React.ReactNode[];
}

interface TitleCardWithHeaderProps {
  title: string;
  sections: Section[];
  backgroundColor?: 'white' | 'green' | 'gray';
  buttonLabel?: string | string[];
  onButtonClick?: (label: string) => void;
}

export function TitleCardWithHeader({
  title,
  sections = [],
  backgroundColor = 'white',
  buttonLabel,
  onButtonClick,
}: TitleCardWithHeaderProps) {
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
    <div>
      <Title order={2}>{title}</Title>

      <Card className="tw:rounded-lg" style={{ backgroundColor: resolvedBackgroundColor }}>
        <CardContent className="tw:p-6">
          <Stack gap="md">
            {sections.map((section, idx) => (
              <React.Fragment key={idx}>
                <Title order={3} style={{ textAlign: 'left' }}>
                  {section.heading}
                </Title>
                {Array.isArray(section.body) ? (
                  section.body.map((para, pIdx) => (
                    <Text
                      key={pIdx}
                      size="md"
                      style={{
                        color: textColor,
                        lineHeight: 1.5,
                        textAlign: 'left',
                        marginBottom: '4px',
                      }}
                    >
                      {para}
                    </Text>
                  ))
                ) : (
                  <Text size="md" style={{ color: textColor, lineHeight: 1.5, textAlign: 'left' }}>
                    {section.body}
                  </Text>
                )}
              </React.Fragment>
            ))}

            {buttonLabel &&
              (Array.isArray(buttonLabel) ? (
                <Group gap="md" className="tw:mt-3">
                  {buttonLabel.map((label, idx) => (
                    <Button key={idx} onClick={() => onButtonClick?.(label)} variant="outline">
                      {label}
                    </Button>
                  ))}
                </Group>
              ) : (
                <Button
                  onClick={() => onButtonClick?.(buttonLabel)}
                  variant="outline"
                  className="tw:mt-3"
                >
                  {buttonLabel}
                </Button>
              ))}
          </Stack>
        </CardContent>
      </Card>
    </div>
  );
}
