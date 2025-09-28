import { ReactNode, useState, useEffect } from 'react';
import BaseModal from './BaseModal';

export interface ModalStep {
  id: string;
  title: string;
  description?: string;
  icon?: ReactNode;
  content: ReactNode;
  size?: string | number;
  primaryButton?: {
    label: string;
    disabled?: boolean;
    loading?: boolean;
  };
  secondaryButton?: {
    label: string;
    variant?: 'outline' | 'subtle' | 'filled';
  };
  onNext?: () => boolean | Promise<boolean>; // Return false to prevent navigation
  onBack?: () => void;
  hideFooter?: boolean;
  footer?: ReactNode;
}

interface MultiStepModalProps {
  opened: boolean;
  onClose: () => void;
  steps: ModalStep[];
  currentStepId?: string;
  onStepChange?: (stepId: string) => void;
  onComplete?: () => void;
}

export default function MultiStepModal({
  opened,
  onClose,
  steps,
  currentStepId,
  onStepChange,
  onComplete,
}: MultiStepModalProps) {
  const [activeStepId, setActiveStepId] = useState(currentStepId || steps[0]?.id);
  const [isNavigating, setIsNavigating] = useState(false);

  useEffect(() => {
    if (currentStepId) {
      setActiveStepId(currentStepId);
    }
  }, [currentStepId]);

  const currentStepIndex = steps.findIndex(step => step.id === activeStepId);
  const currentStep = steps[currentStepIndex];
  const isLastStep = currentStepIndex === steps.length - 1;
  const isFirstStep = currentStepIndex === 0;

  if (!currentStep) {
    return null;
  }

  const handleNext = async () => {
    if (currentStep.onNext) {
      setIsNavigating(true);
      try {
        const canProceed = await currentStep.onNext();
        if (!canProceed) {
          setIsNavigating(false);
          return;
        }
      } catch (error) {
        console.error('Error in step navigation:', error);
        setIsNavigating(false);
        return;
      }
    }

    if (isLastStep) {
      if (onComplete) {
        onComplete();
      }
      onClose();
    } else {
      const nextStep = steps[currentStepIndex + 1];
      setActiveStepId(nextStep.id);
      if (onStepChange) {
        onStepChange(nextStep.id);
      }
    }
    setIsNavigating(false);
  };

  const handleBack = () => {
    if (currentStep.onBack) {
      currentStep.onBack();
    }

    if (isFirstStep) {
      onClose();
    } else {
      const prevStep = steps[currentStepIndex - 1];
      setActiveStepId(prevStep.id);
      if (onStepChange) {
        onStepChange(prevStep.id);
      }
    }
  };

  const primaryButton = currentStep.primaryButton || {
    label: isLastStep ? 'Complete' : 'Next',
    disabled: false,
    loading: isNavigating,
  };

  const secondaryButton = currentStep.secondaryButton || {
    label: isFirstStep ? 'Cancel' : 'Back',
    variant: 'outline' as const,
  };

  return (
    <BaseModal
      opened={opened}
      onClose={onClose}
      title={currentStep.title}
      description={currentStep.description}
      icon={currentStep.icon}
      size={currentStep.size || 'sm'}
      hideFooter={currentStep.hideFooter}
      footer={currentStep.footer}
      primaryButton={{
        ...primaryButton,
        onClick: handleNext,
        loading: isNavigating,
      }}
      secondaryButton={{
        ...secondaryButton,
        onClick: isFirstStep ? onClose : handleBack,
      }}
    >
      {currentStep.content}
    </BaseModal>
  );
}