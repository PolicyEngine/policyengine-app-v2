import { Group, Box, Text, ThemeIcon } from '@mantine/core';
import { IconCheck } from '@tabler/icons-react';
import { stepIndicatorDesign } from '@/styles/modalDesign';

export interface Step {
  id: string;
  label?: string;
}

interface StepIndicatorProps {
  steps: Step[];
  currentStepIndex: number;
  showLabels?: boolean;
}

export default function StepIndicator({
  steps,
  currentStepIndex,
  showLabels = false,
}: StepIndicatorProps) {
  return (
    <Group justify="center" gap={stepIndicatorDesign.spacing} wrap="nowrap">
      {steps.map((step, index) => {
        const isActive = index === currentStepIndex;
        const isCompleted = index < currentStepIndex;
        const isPending = index > currentStepIndex;

        const color = isCompleted
          ? stepIndicatorDesign.colors.completed
          : isActive
          ? stepIndicatorDesign.colors.active
          : stepIndicatorDesign.colors.pending;

        const textColor = isCompleted || isActive
          ? stepIndicatorDesign.colors.text.active
          : stepIndicatorDesign.colors.text.pending;

        return (
          <Group key={step.id} gap={stepIndicatorDesign.spacing} wrap="nowrap">
            {/* Connecting line before step (except first) */}
            {index > 0 && (
              <Box
                style={{
                  width: stepIndicatorDesign.lineWidth,
                  height: stepIndicatorDesign.lineHeight,
                  backgroundColor: isCompleted
                    ? stepIndicatorDesign.colors.completed
                    : stepIndicatorDesign.colors.pending,
                  transition: 'background-color 200ms ease',
                }}
              />
            )}

            {/* Step indicator */}
            <Box style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
              <ThemeIcon
                size={stepIndicatorDesign.size}
                radius="xl"
                color={color}
                variant="filled"
                style={{
                  transition: 'all 200ms ease',
                  transform: isActive ? 'scale(1.1)' : 'scale(1)',
                  boxShadow: isActive ? '0 4px 12px rgba(14, 165, 233, 0.3)' : 'none',
                }}
              >
                {isCompleted ? (
                  <IconCheck size={18} stroke={2.5} />
                ) : (
                  <Text size="sm" fw={600} c={textColor}>
                    {index + 1}
                  </Text>
                )}
              </ThemeIcon>

              {/* Optional label */}
              {showLabels && step.label && (
                <Text
                  size="xs"
                  fw={isActive ? 600 : 500}
                  c={isActive ? 'dark' : 'dimmed'}
                  style={{
                    transition: 'all 150ms ease',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {step.label}
                </Text>
              )}
            </Box>
          </Group>
        );
      })}
    </Group>
  );
}
