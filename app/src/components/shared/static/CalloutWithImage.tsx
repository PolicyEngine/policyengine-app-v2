import { Button } from '@/components/ui';
import { Container, Stack, Text, Title } from '@/components/ui';
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
    <Container size="xl" className="tw:px-2 tw:py-12">
      <div className="tw:grid tw:grid-cols-1 md:tw:grid-cols-2 tw:gap-8 tw:items-center">
        {/* Left Column */}
        <Stack gap="md">
          <Title
            order={2}
            style={{
              fontSize: typography.fontSize['4xl'],
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
              onClick={onButtonClick}
              style={{
                backgroundColor: colors.primary[400],
                alignSelf: 'flex-start',
                marginTop: '14px',
              }}
            >
              {buttonLabel}
            </Button>
          )}
        </Stack>

        {/* Right Column */}
        <div className="tw:flex tw:justify-center">
          <img
            src={imageSrc}
            alt={imageAlt}
            className="tw:rounded-lg tw:object-cover"
            style={{ width: '90%', height: 'auto' }}
          />
        </div>
      </div>
    </Container>
  );
}
