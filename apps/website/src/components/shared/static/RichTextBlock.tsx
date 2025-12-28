import { ReactNode } from 'react';
import { colors } from '@policyengine/design-system';

import '@/styles/stylesheets/RichTextBlock.css';

export interface RichTextBlockProps {
  children: ReactNode;
  variant?: 'default' | 'inverted';
}

// Note: For most components, we don't condone separate CSS stylesheets, but Mantine
// provides no way to provide styling to child components natively
export default function RichTextBlock({ children, variant = 'default' }: RichTextBlockProps) {
  const textColor = variant === 'inverted' ? colors.text.inverse : colors.text.primary;
  const linkColor = variant === 'inverted' ? colors.text.inverse : colors.primary[500];

  return (
    <div
      className="rich-text-block"
      style={{
        color: textColor,
        // CSS custom property for link color that the variant can use
        ['--link-color' as any]: linkColor,
      }}
    >
      {children}
    </div>
  );
}
