import { useState } from 'react';
import { IngredientErrorIcon } from '@/components/common/IngredientErrorIcon';
import { Text } from '@/components/ui';
import { colors, spacing } from '@/designTokens';
import { FONT_SIZES } from '../../constants';
import { chipStyles } from '../../styles';
import { OptionChipSquareProps } from '../../types';

export function OptionChipSquare({
  icon,
  label,
  description,
  isSelected,
  onClick,
  colorConfig,
  isDisabled,
  errorMessage,
}: OptionChipSquareProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      role="button"
      tabIndex={isDisabled ? -1 : 0}
      aria-disabled={isDisabled || undefined}
      style={{
        ...chipStyles.chipSquare,
        position: 'relative',
        borderColor: isSelected ? colorConfig.accent : colors.border.light,
        background: isSelected
          ? colorConfig.bg
          : isHovered && !isDisabled
            ? colors.gray[50]
            : colors.white,
        cursor: isDisabled ? 'not-allowed' : 'pointer',
        opacity: isDisabled ? 0.6 : 1,
        ...(isSelected
          ? {
              ...chipStyles.chipSquareSelected,
              boxShadow: `0 0 0 2px ${colorConfig.bg}`,
            }
          : {}),
      }}
      onMouseEnter={() => !isDisabled && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => !isDisabled && onClick()}
      onKeyDown={(e) => {
        if (!isDisabled && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onClick();
        }
      }}
    >
      {errorMessage && (
        <span className="tw:absolute tw:right-2 tw:top-2">
          <IngredientErrorIcon message={errorMessage} />
        </span>
      )}
      <div
        style={{
          width: 28,
          height: 28,
          borderRadius: spacing.radius.element,
          background: isSelected ? colorConfig.border : colors.gray[100],
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {icon}
      </div>
      <Text
        fw={600}
        c={isSelected ? colorConfig.icon : colors.gray[700]}
        style={{ textAlign: 'center', fontSize: FONT_SIZES.small, lineHeight: 1.2 }}
      >
        {label}
      </Text>
      {description && (
        <Text
          c="dimmed"
          style={{ textAlign: 'center', fontSize: FONT_SIZES.tiny, lineHeight: 1.2 }}
        >
          {description}
        </Text>
      )}
    </div>
  );
}
