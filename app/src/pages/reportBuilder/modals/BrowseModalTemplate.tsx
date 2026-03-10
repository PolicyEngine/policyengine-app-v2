/**
 * BrowseModalTemplate - Shared template for browse modals (Policy, Population)
 *
 * Handles ONLY visual layout:
 * - Dialog shell with header
 * - Sidebar (standard sections OR custom render)
 * - Main content area
 * - Optional status header slot
 * - Optional footer slot
 */
import { IconChevronLeft } from '@tabler/icons-react';
import {
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  Group,
  ScrollArea,
  Separator,
  Spinner,
  Stack,
  Text,
} from '@/components/ui';
import { colors, spacing } from '@/designTokens';
import { BROWSE_MODAL_CONFIG, FONT_SIZES } from '../constants';
import { modalStyles } from '../styles';
import { BrowseModalSidebarSection, BrowseModalTemplateProps } from '../types';

/**
 * A reusable template for browse modals (PolicyBrowseModal, PopulationBrowseModal).
 * Handles only visual display logic - sidebar layout, modal chrome, content slots.
 */
export function BrowseModalTemplate({
  isOpen,
  onClose,
  headerIcon,
  headerTitle,
  headerSubtitle,
  headerRightContent,
  colorConfig,
  sidebarSections,
  renderSidebar,
  sidebarWidth = BROWSE_MODAL_CONFIG.sidebarWidth,
  renderMainContent,
  statusHeader,
  footer,
  contentPadding = spacing.lg,
}: BrowseModalTemplateProps) {
  // Render standard sidebar sections
  const renderStandardSidebar = (sections: BrowseModalSidebarSection[]) => (
    <ScrollArea className="tw:flex-1">
      <Stack gap="lg">
        {sections.map((section, sectionIndex) => (
          <div key={section.id}>
            {sectionIndex > 0 && <Separator style={{ marginBottom: spacing.lg }} />}
            <div style={modalStyles.sidebarSection}>
              <Text style={modalStyles.sidebarLabel}>{section.label}</Text>
              {section.items?.map((item) => (
                <button
                  type="button"
                  key={item.id}
                  style={{
                    all: 'unset',
                    ...modalStyles.sidebarItem,
                    background: item.isActive ? colorConfig.bg : 'transparent',
                    color: item.isActive ? colorConfig.icon : colors.gray[700],
                  }}
                  onClick={item.onClick}
                >
                  {item.icon}
                  <Text style={{ fontSize: FONT_SIZES.small, flex: 1 }}>{item.label}</Text>
                  {item.badge !== undefined && (
                    <Text fw={700} style={{ fontSize: FONT_SIZES.small, color: colors.gray[500] }}>
                      {item.badge}
                    </Text>
                  )}
                </button>
              ))}
            </div>
          </div>
        ))}
      </Stack>
    </ScrollArea>
  );

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        showCloseButton
        className="tw:sm:max-w-none tw:p-0 tw:gap-0"
        style={{
          width: BROWSE_MODAL_CONFIG.width,
          maxWidth: BROWSE_MODAL_CONFIG.maxWidth,
          height: BROWSE_MODAL_CONFIG.height,
          maxHeight: BROWSE_MODAL_CONFIG.maxHeight,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header */}
        <div
          style={{
            borderBottom: `1px solid ${colors.border.light}`,
            padding: `${spacing.md} ${spacing.xl}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Group gap="sm">
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: spacing.radius.container,
                background: `linear-gradient(135deg, ${colorConfig.bg} 0%, ${colors.white} 100%)`,
                border: `1px solid ${colorConfig.border}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {headerIcon}
            </div>
            <Stack style={{ gap: 0 }}>
              <DialogTitle
                className="tw:text-base tw:font-semibold"
                style={{ color: colors.gray[900] }}
              >
                {headerTitle}
              </DialogTitle>
              {headerSubtitle && (
                <Text c="dimmed" style={{ fontSize: FONT_SIZES.small }}>
                  {headerSubtitle}
                </Text>
              )}
            </Stack>
          </Group>
          {headerRightContent}
        </div>

        {/* Main layout: sidebar + content */}
        <Group align="stretch" wrap="nowrap" style={{ flex: 1, overflow: 'hidden', gap: 0 }}>
          {/* Sidebar */}
          <div
            style={{
              width: sidebarWidth,
              borderRight: `1px solid ${colors.border.light}`,
              display: 'flex',
              flexDirection: 'column',
              flexShrink: 0,
              padding: spacing.lg,
              overflow: 'hidden',
            }}
          >
            {renderSidebar
              ? renderSidebar()
              : sidebarSections && renderStandardSidebar(sidebarSections)}
          </div>

          {/* Main Content Area */}
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              background: colors.white,
            }}
          >
            {/* Optional Status Header */}
            {statusHeader}

            {/* Main Content */}
            <div style={{ flex: 1, overflow: 'auto', padding: contentPadding }}>
              {renderMainContent()}
            </div>
          </div>
        </Group>

        {/* Footer spans full width, outside the sidebar/content layout */}
        {footer && (
          <div
            style={{
              padding: `${spacing.md} ${spacing.xl}`,
              borderTop: `1px solid ${colors.border.light}`,
              background: colors.white,
              flexShrink: 0,
            }}
          >
            {footer}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

interface CreationModeFooterProps {
  onBack: () => void;
  onSubmit: () => void;
  isLoading: boolean;
  submitDisabled: boolean;
  submitLabel: string;
  backLabel?: string;
}

export function CreationModeFooter({
  onBack,
  onSubmit,
  isLoading,
  submitDisabled,
  submitLabel,
  backLabel = 'Back',
}: CreationModeFooterProps) {
  return (
    <Group justify="space-between">
      <Button variant="ghost" onClick={onBack}>
        <IconChevronLeft size={16} />
        {backLabel}
      </Button>
      <Button onClick={onSubmit} disabled={isLoading || submitDisabled}>
        {isLoading && <Spinner size="sm" />}
        {submitLabel}
      </Button>
    </Group>
  );
}
