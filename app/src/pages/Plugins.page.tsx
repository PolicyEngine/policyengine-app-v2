/**
 * Plugins Page
 *
 * Displays available plugins with install/remove functionality.
 * Uses the plugin context for proper activation/deactivation.
 * Part of the calculator UX (shows sidebar).
 */

import { useCallback, useState } from 'react';
import { IconSettings } from '@tabler/icons-react';
import { ActionIcon, Box, Button, Group, Paper, SimpleGrid, Stack, Text, Title } from '@mantine/core';
import { colors, spacing, typography } from '@/designTokens';
import { PluginSettingsModal, usePluginContext } from '@/plugins';
import type { Plugin, PluginSettingsValues } from '@/types/plugin';

/** Aspect ratio for plugin icon containers (matches SVG dimensions) */
const ICON_ASPECT_RATIO = '16 / 9';

interface PluginCardProps {
  plugin: Plugin;
  isInstalled: boolean;
  onToggle: (slug: string, installed: boolean) => void;
  onOpenSettings: (plugin: Plugin) => void;
}

function PluginCard({ plugin, isInstalled, onToggle, onOpenSettings }: PluginCardProps) {
  const formattedDateUpdated = new Date(plugin.dateUpdated).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  const handleToggle = () => {
    onToggle(plugin.slug, !isInstalled);
  };

  const hasSettings = plugin.settings && plugin.settings.length > 0;

  return (
    <Paper
      shadow="xs"
      radius="md"
      style={{
        overflow: 'hidden',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        border: `1px solid ${colors.border.light}`,
      }}
    >
      {/* Icon container with aspect ratio - icons have their own backgrounds */}
      <Box
        style={{
          aspectRatio: ICON_ASPECT_RATIO,
          backgroundColor: colors.gray[100],
          overflow: 'hidden',
        }}
      >
        {plugin.image && (
          <img
            src={plugin.image}
            alt={plugin.name}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        )}
      </Box>

      {/* Content */}
      <Box
        style={{
          padding: spacing.md,
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Title with settings button */}
        <Group justify="space-between" align="flex-start" mb={4}>
          <Text
            fw={typography.fontWeight.semibold}
            size="md"
            style={{ color: colors.gray[900] }}
          >
            {plugin.name}
          </Text>
          {hasSettings && isInstalled && (
            <ActionIcon
              variant="subtle"
              color="gray"
              size="sm"
              onClick={() => onOpenSettings(plugin)}
              aria-label={`${plugin.name} settings`}
            >
              <IconSettings size={16} />
            </ActionIcon>
          )}
        </Group>

        {/* Description */}
        <Text size="sm" c="dimmed" lineClamp={2} style={{ flex: 1, marginBottom: spacing.sm }}>
          {plugin.description}
        </Text>

        {/* Date */}
        <Text size="xs" c="dimmed" mb="sm">
          Updated {formattedDateUpdated}
        </Text>

        {/* Install/Remove Button */}
        <Button
          variant={isInstalled ? 'outline' : 'filled'}
          color={isInstalled ? 'red' : undefined}
          size="sm"
          fullWidth
          onClick={handleToggle}
          styles={
            !isInstalled
              ? {
                  root: {
                    backgroundColor: colors.button.primaryBg,
                    color: colors.button.primaryText,
                    '&:hover': {
                      backgroundColor: colors.button.primaryHover,
                    },
                  },
                }
              : undefined
          }
        >
          {isInstalled ? 'Remove' : 'Install'}
        </Button>
      </Box>
    </Paper>
  );
}

export default function PluginsPage() {
  // Use plugin context for proper activation/deactivation
  const {
    availablePlugins,
    activePlugins,
    installPlugin,
    uninstallPlugin,
    isPluginActive,
    getSettings,
    updateSettings,
  } = usePluginContext();

  // Settings modal state
  const [settingsPlugin, setSettingsPlugin] = useState<Plugin | null>(null);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);

  const handleTogglePlugin = useCallback(
    async (slug: string, shouldInstall: boolean) => {
      if (shouldInstall) {
        await installPlugin(slug);
      } else {
        await uninstallPlugin(slug);
      }
    },
    [installPlugin, uninstallPlugin]
  );

  const handleOpenSettings = useCallback((plugin: Plugin) => {
    setSettingsPlugin(plugin);
    setSettingsModalOpen(true);
  }, []);

  const handleCloseSettings = useCallback(() => {
    setSettingsModalOpen(false);
    setSettingsPlugin(null);
  }, []);

  const handleSaveSettings = useCallback(
    async (newSettings: PluginSettingsValues) => {
      if (settingsPlugin) {
        await updateSettings(settingsPlugin.slug, newSettings);
      }
    },
    [settingsPlugin, updateSettings]
  );

  const installedCount = activePlugins.length;

  return (
    <Stack gap="md">
      {/* Header */}
      <Box>
        <Title order={2} mb={4} style={{ color: colors.gray[900] }}>
          Plugins
        </Title>
        <Text size="sm" c="dimmed">
          Enhance your experience with optional plugins.
          {installedCount > 0 && ` ${installedCount} of ${availablePlugins.length} installed.`}
        </Text>
      </Box>

      {/* Plugin Grid */}
      {availablePlugins.length > 0 ? (
        <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
          {availablePlugins.map((plugin) => (
            <PluginCard
              key={plugin.slug}
              plugin={plugin}
              isInstalled={isPluginActive(plugin.slug)}
              onToggle={handleTogglePlugin}
              onOpenSettings={handleOpenSettings}
            />
          ))}
        </SimpleGrid>
      ) : (
        <Paper
          p="xl"
          radius="md"
          style={{
            textAlign: 'center',
            backgroundColor: colors.gray[50],
            border: `1px solid ${colors.border.light}`,
          }}
        >
          <Text c="dimmed">No plugins available yet.</Text>
        </Paper>
      )}

      {/* Settings Modal */}
      {settingsPlugin && (
        <PluginSettingsModal
          opened={settingsModalOpen}
          onClose={handleCloseSettings}
          plugin={settingsPlugin}
          currentSettings={getSettings(settingsPlugin.slug)}
          onSave={handleSaveSettings}
        />
      )}
    </Stack>
  );
}
