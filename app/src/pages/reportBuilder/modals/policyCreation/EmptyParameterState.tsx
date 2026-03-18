/**
 * EmptyParameterState - Displayed when no parameter is selected
 */

import React from 'react';
import { IconScale } from '@tabler/icons-react';
import { Stack, Text } from '@/components/ui';
import { colors, spacing } from '@/designTokens';
import { FONT_SIZES } from '../../constants';
import { EmptyParameterStateProps } from './types';

export function EmptyParameterState({
  message = 'Select a parameter from the menu to modify its value for your policy reform.',
}: EmptyParameterStateProps) {
  return (
    <div
      style={{
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: spacing.xl,
      }}
    >
      <Stack align="center" gap="md">
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: spacing.radius.feature,
            background: colors.gray[100],
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <IconScale size={32} color={colors.gray[400]} />
        </div>
        <Text
          style={{
            textAlign: 'center',
            fontSize: FONT_SIZES.normal,
            color: colors.gray[600],
            maxWidth: 400,
          }}
        >
          {message}
        </Text>
      </Stack>
    </div>
  );
}
