/**
 * BrowseModalTemplate - Shared template for browse modals (Policy, Population)
 *
 * Handles ONLY visual layout:
 * - Modal shell with header
 * - Sidebar (standard sections OR custom render)
 * - Main content area
 * - Optional status header slot
 * - Optional footer slot
 */
import { ReactNode } from 'react';
import {
  Box,
  Group,
  Text,
  Modal,
  UnstyledButton,
  Stack,
  Divider,
  ScrollArea,
  Button,
} from '@mantine/core';
import { IconChevronLeft } from '@tabler/icons-react';
import { colors, spacing } from '@/designTokens';
import { FONT_SIZES, BROWSE_MODAL_CONFIG } from '../constants';
import { modalStyles } from '../styles';
import { BrowseModalTemplateProps, BrowseModalSidebarSection } from '../types';

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
    <ScrollArea style={{ flex: 1 }} offsetScrollbars>
      <Stack gap={spacing.lg}>
        {sections.map((section, sectionIndex) => (
          <Box key={section.id}>
            {sectionIndex > 0 && <Divider mb={spacing.lg} />}
            <Box style={modalStyles.sidebarSection}>
              <Text style={modalStyles.sidebarLabel}>{section.label}</Text>
              {section.items.map((item) => (
                <UnstyledButton
                  key={item.id}
                  style={{
                    ...modalStyles.sidebarItem,
                    background: item.isActive ? colorConfig.bg : 'transparent',
                    color: item.isActive ? colorConfig.icon : colors.gray[700],
                  }}
                  onClick={item.onClick}
                >
                  {item.icon}
                  <Text style={{ fontSize: FONT_SIZES.small, flex: 1 }}>
                    {item.label}
                  </Text>
                  {item.badge !== undefined && (
                    <Text
                      fw={700}
                      style={{ fontSize: FONT_SIZES.small, color: colors.gray[500] }}
                    >
                      {item.badge}
                    </Text>
                  )}
                </UnstyledButton>
              ))}
            </Box>
          </Box>
        ))}
      </Stack>
    </ScrollArea>
  );

  return (
    <Modal
      opened={isOpen}
      onClose={onClose}
      title={
        <Group justify="space-between" align="center" wrap="nowrap" style={{ width: '100%' }}>
          <Group gap={spacing.sm}>
            <Box
              style={{
                width: 36,
                height: 36,
                borderRadius: spacing.radius.md,
                background: `linear-gradient(135deg, ${colorConfig.bg} 0%, ${colors.white} 100%)`,
                border: `1px solid ${colorConfig.border}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {headerIcon}
            </Box>
            <Stack gap={0}>
              {typeof headerTitle === 'string' ? (
                <Text fw={600} style={{ fontSize: FONT_SIZES.normal, color: colors.gray[900] }}>
                  {headerTitle}
                </Text>
              ) : (
                headerTitle
              )}
              {headerSubtitle && (
                <Text c="dimmed" style={{ fontSize: FONT_SIZES.small }}>
                  {headerSubtitle}
                </Text>
              )}
            </Stack>
          </Group>
          {headerRightContent}
        </Group>
      }
      size={BROWSE_MODAL_CONFIG.width}
      radius="lg"
      styles={{
        content: {
          maxWidth: BROWSE_MODAL_CONFIG.maxWidth,
          height: BROWSE_MODAL_CONFIG.height,
          maxHeight: BROWSE_MODAL_CONFIG.maxHeight,
          display: 'flex',
          flexDirection: 'column',
        },
        header: {
          borderBottom: `1px solid ${colors.border.light}`,
          paddingBottom: spacing.md,
          paddingLeft: spacing.xl,
          paddingRight: spacing.xl,
        },
        title: {
          flex: 1,
        },
        body: {
          padding: 0,
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        },
      }}
    >
      {/* Main layout: sidebar + content */}
      <Group align="stretch" gap={0} style={{ flex: 1, overflow: 'hidden' }} wrap="nowrap">
        {/* Sidebar */}
        <Box
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
          {renderSidebar ? renderSidebar() : (sidebarSections && renderStandardSidebar(sidebarSections))}
        </Box>

        {/* Main Content Area */}
        <Box
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
          <Box style={{ flex: 1, overflow: 'auto', padding: contentPadding }}>
            {renderMainContent()}
          </Box>
        </Box>
      </Group>

      {/* Footer spans full width, outside the sidebar/content layout */}
      {footer && (
        <Box
          style={{
            padding: `${spacing.md} ${spacing.xl}`,
            borderTop: `1px solid ${colors.border.light}`,
            background: colors.white,
            flexShrink: 0,
          }}
        >
          {footer}
        </Box>
      )}
    </Modal>
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
      <Button
        variant="subtle"
        color="gray"
        leftSection={<IconChevronLeft size={16} />}
        onClick={onBack}
      >
        {backLabel}
      </Button>
      <Button
        color="teal"
        onClick={onSubmit}
        loading={isLoading}
        disabled={submitDisabled}
      >
        {submitLabel}
      </Button>
    </Group>
  );
}
