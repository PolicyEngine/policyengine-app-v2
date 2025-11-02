import { Badge, Card, Stack, Text } from '@mantine/core';
import { colors, spacing, typography } from '@/designTokens';

interface ParameterMetadata {
  type: 'parameter';
  parameter: string;
  label?: string;
  description?: string;
  unit?: string;
  period?: string | null;
  economy?: boolean;
  household?: boolean;
  values?: Record<string, number>;
}

interface VariableMetadata {
  name: string;
  label?: string;
  description?: string;
  entity?: string;
  definitionPeriod?: string;
  unit?: string;
  category?: string;
  defaultValue?: number;
  isInputVariable?: boolean;
  valueType?: string;
}

interface APIMetadataCardProps {
  metadata: ParameterMetadata | VariableMetadata;
  onClick?: () => void;
}

export default function APIMetadataCard({ metadata, onClick }: APIMetadataCardProps) {
  const isParameter = 'type' in metadata && metadata.type === 'parameter';
  const paramData = isParameter ? (metadata as ParameterMetadata) : null;
  const varData = !isParameter ? (metadata as VariableMetadata) : null;

  const displayLabel = paramData?.label || varData?.label || varData?.name || '';
  const description = metadata.description || '';
  const pythonName = paramData?.parameter || varData?.name || '';

  return (
    <Card
      shadow="xs"
      padding={spacing.md}
      radius="md"
      onClick={onClick}
      style={{
        cursor: onClick ? 'pointer' : 'default',
        transition: 'box-shadow 0.2s ease',
        backgroundColor: colors.white,
        border: `1px solid ${colors.gray[200]}`,
        height: '100%',
      }}
      styles={{
        root: {
          '&:hover': {
            boxShadow: onClick ? '0 4px 12px rgba(0,0,0,0.1)' : undefined,
          },
        },
      }}
    >
      <Stack gap={spacing.sm}>
        <Badge color={isParameter ? 'primary' : 'blue'} variant="light" size="sm">
          {isParameter ? 'Parameter' : 'Variable'}
        </Badge>

        <Text fw={typography.fontWeight.semibold} style={{ fontSize: typography.fontSize.base }}>
          {displayLabel}
        </Text>

        {description && (
          <Text
            style={{
              fontSize: typography.fontSize.sm,
              color: colors.text.secondary,
              lineHeight: 1.5,
            }}
          >
            {description}
          </Text>
        )}

        {varData?.entity && (
          <Text style={{ fontSize: typography.fontSize.xs, color: colors.text.tertiary }}>
            <strong>Entity:</strong> {varData.entity}
          </Text>
        )}

        {(paramData?.period || varData?.definitionPeriod) && (
          <Text style={{ fontSize: typography.fontSize.xs, color: colors.text.tertiary }}>
            <strong>Period:</strong> {paramData?.period || varData?.definitionPeriod}
          </Text>
        )}

        {metadata.unit && (
          <Text style={{ fontSize: typography.fontSize.xs, color: colors.text.tertiary }}>
            <strong>Unit:</strong> {metadata.unit}
          </Text>
        )}

        <Text
          style={{
            fontSize: typography.fontSize.xs,
            color: colors.text.tertiary,
            wordBreak: 'break-all',
            fontFamily: typography.fontFamily.mono,
          }}
        >
          <strong>Python name:</strong> {pythonName}
        </Text>
      </Stack>
    </Card>
  );
}
