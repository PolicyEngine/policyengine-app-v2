/**
 * AppVisual Component
 *
 * Unified rendering for app visuals from apps.json.
 * - "css:name" → renders the corresponding CSS visual from the registry
 * - URL or filename → renders an <img> tag
 * - undefined → renders a decorative bar chart placeholder
 */

import { Box } from '@mantine/core';
import { colors, spacing } from '@/designTokens';
import { getCSSVisual, getCSSVisualName, isCSSVisual, type CSSVisualProps } from './registry';

interface AppVisualProps {
  /** The image field from apps.json */
  image?: string;
  /** Alt text for regular images */
  alt?: string;
  /** Visual variant passed to CSS visuals */
  variant?: CSSVisualProps['variant'];
  /** Container height */
  height?: string;
  /** Whether this is in a featured context (affects CSS visual sizing) */
  featured?: boolean;
}

export function AppVisual({
  image,
  alt = '',
  variant = 'light',
  height = '200px',
  featured = false,
}: AppVisualProps) {
  if (isCSSVisual(image)) {
    const name = getCSSVisualName(image!);
    const VisualComponent = getCSSVisual(name);

    if (!VisualComponent) {
      console.warn(`[AppVisual] CSS visual "${name}" not found in registry`);
      return <Placeholder height={height} />;
    }

    return (
      <Box
        style={{
          width: '100%',
          height: variant === 'dark' ? 'auto' : height,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: variant === 'dark' ? undefined : colors.primary[50],
          padding: spacing.md,
        }}
      >
        <VisualComponent variant={variant} maxWidth={featured ? '320px' : '240px'} />
      </Box>
    );
  }

  if (image) {
    const src = image.startsWith('http') ? image : `/assets/posts/${image}`;
    return (
      <Box style={{ height, overflow: 'hidden', backgroundColor: colors.gray[100] }}>
        <img
          src={src}
          alt={alt}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          onError={(e) => {
            e.currentTarget.style.display = 'none';
          }}
        />
      </Box>
    );
  }

  return <Placeholder height={height} />;
}

function Placeholder({ height }: { height: string }) {
  return (
    <Box
      style={{
        width: '100%',
        height,
        background: `linear-gradient(135deg, ${colors.primary[50]} 0%, ${colors.primary[100]} 100%)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Box
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          gap: '6px',
          height: '80px',
        }}
      >
        {[35, 65, 45, 80, 55, 40, 70].map((h, i) => (
          <Box
            key={i}
            style={{
              width: '16px',
              height: `${h}%`,
              borderRadius: '3px 3px 0 0',
              backgroundColor: i % 2 === 0 ? colors.primary[200] : colors.primary[300],
            }}
          />
        ))}
      </Box>
    </Box>
  );
}
