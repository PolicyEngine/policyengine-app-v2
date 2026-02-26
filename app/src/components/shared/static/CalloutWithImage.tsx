import { Button, Container, Grid, Image, Stack, Text, Title } from '@mantine/core';
import { colors, spacing, typography } from '@/designTokens';

export interface CalloutWithImageProps {
  title: string;
  description: string;
  buttonLabel?: string;
  onButtonClick?: () => void;
  imageSrc: string;
  /**
   * Provide meaningful alt text for accessibility.
   * Use an empty string ("") if the image is decorative.
   */
  imageAlt: string;
}

export default function CalloutWithImage({
  title,
  description,
  buttonLabel,
  onButtonClick,
  imageSrc,
  imageAlt,
}: CalloutWithImageProps) {
  return (
    <Container size="xl" px="sm" py="3xl">
      <Grid align="center" gutter="xl">
        {/* Left Column */}
        <Grid.Col span={{ base: 12, md: 6 }}>
          <Stack gap="md">
            <Title
              size={typography.fontSize['4xl']}
              style={{
                color: colors.text.primary,
                fontWeight: typography.fontWeight.medium,
                fontFamily: typography.fontFamily.primary,
              }}
            >
              {title}
            </Title>
            <Text
              size="lg"
              style={{ color: colors.text.secondary, lineHeight: typography.lineHeight.snug }}
            >
              {description}
            </Text>
            {buttonLabel && (
              <Button
                size="lg"
                radius="md"
                color={colors.primary[400]}
                onClick={onButtonClick}
                style={{
                  borderRadius: spacing.radius.none,
                  alignSelf: 'flex-start',
                  marginTop: '14px',
                }}
              >
                {buttonLabel}
              </Button>
            )}
          </Stack>
        </Grid.Col>

        {/* Right Column */}
        <Grid.Col span={{ base: 12, md: 6 }}>
          <Image
            src={imageSrc}
            alt={imageAlt}
            radius="lg"
            style={{ width: '90%', height: 'auto', objectFit: 'cover', justifySelf: 'center' }}
          />
        </Grid.Col>
      </Grid>
    </Container>
  );
}
