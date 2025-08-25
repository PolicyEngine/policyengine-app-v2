import { Button, Container, Grid, Stack, Text, Title, Image } from '@mantine/core';
import { colors, typography } from '@/designTokens';

export interface CalloutWithImageProps {
  title: string;
  description: string;
  buttonLabel?: string;
  onButtonClick?: () => void;
  imageSrc: string;
  imageAlt?: string;
}

export default function CalloutWithImage({
  title,
  description,
  buttonLabel,
  onButtonClick,
  imageSrc,
  imageAlt = 'Callout image',
}: CalloutWithImageProps) 
{
  return (
    <Container size="xl" px="sm" py="3xl" >
      <Grid align="center" gutter="xl">
        {/* Left Column */}
        <Grid.Col span={{ base: 12, md: 6 }}>
          <Stack gap="md">
            <Title size={typography.fontSize['4xl']} style={{ fontWeight: typography.fontWeight.medium, fontFamily: typography.fontFamily.primary }}>
              {title}
            </Title>
            <Text size="lg" c="dimmed" style={{ lineHeight: 1.6, }}>
              {description}
            </Text>
            {buttonLabel && (
              <Button
                size="lg"
                radius="md"
                color={colors.primary[400]}
                onClick={onButtonClick}
                style={{ 
                  borderRadius: 0,
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
