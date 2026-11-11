import { useState } from 'react';
import { IconCheck } from '@tabler/icons-react';
import { IngredientErrorIcon } from '@/components/common/IngredientErrorIcon';
import { Stack, Text } from '@/components/ui';
import { colors } from '@/designTokens';
import { FONT_SIZES } from '../../constants';
import { chipStyles } from '../../styles';
import { OptionChipRowProps } from '../../types';

export function OptionChipRow({
  icon,
  label,
  description,
  isSelected,
  onClick,
  colorConfig,
  isDisabled,
  errorMessage,
}: OptionChipRowProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      role="button"
      tabIndex={isDisabled ? -1 : 0}
      aria-disabled={isDisabled || undefined}
      style={{
        ...chipStyles.chipRow,
        borderColor: isSelected ? colorConfig.accent : colors.border.light,
        background: isSelected
          ? colorConfig.bg
          : isHovered && !isDisabled
            ? colors.gray[50]
            : colors.white,
        cursor: isDisabled ? 'not-allowed' : 'pointer',
        opacity: isDisabled ? 0.6 : 1,
        ...(isSelected ? chipStyles.chipRowSelected : {}),
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
      <div
        style={{
          ...chipStyles.chipRowIcon,
          background: isSelected ? colorConfig.border : colors.gray[100],
        }}
      >
        {icon}
      </div>
      <Stack style={{ gap: 2, flex: 1 }}>
        <Text
          fw={600}
          c={isSelected ? colorConfig.icon : colors.gray[700]}
          style={{ fontSize: FONT_SIZES.normal }}
        >
          {label}
        </Text>
        {description && (
          <Text c="dimmed" style={{ fontSize: FONT_SIZES.small }}>
            {description}
          </Text>
        )}
      </Stack>
      {errorMessage ? (
        <IngredientErrorIcon message={errorMessage} />
      ) : (
        isSelected && <IconCheck size={18} color={colorConfig.accent} stroke={2.5} />
      )}
    </div>
  );
}
