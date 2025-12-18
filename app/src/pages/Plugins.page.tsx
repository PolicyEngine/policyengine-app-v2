/**
 * Plugins Page
 *
 * Displays available plugins with install/remove functionality.
 * Includes both built-in plugins and chart plugins from GitHub.
 * Uses the plugin context for proper activation/deactivation.
 * Part of the calculator UX (shows sidebar).
 */

import { useCallback, useEffect, useState } from 'react';
import { IconChartBar, IconDownload, IconSettings, IconTrash } from '@tabler/icons-react';
import {
  ActionIcon,
  Alert,
  Badge,
  Box,
  Button,
  Divider,
  Group,
  Loader,
  Paper,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import { colors, spacing, typography } from '@/designTokens';
import { PluginSettingsModal, usePluginContext } from '@/plugins';
import {
  chartPluginLoader,
  chartPluginRegistry,
  type InstalledChartPlugin,
} from '@/plugins/chartPlugins';
import type { Plugin, PluginSettingsValues } from '@/types/plugin';

/** Aspect ratio for plugin icon containers (matches SVG dimensions) */
const ICON_ASPECT_RATIO = '16 / 9';

interface PluginCardProps {
  plugin: Plugin;
  isInstalled: boolean;
  onToggle: (slug: string, installed: boolean) => void;
  onOpenSettings: (plugin: Plugin) => void;
}

// =============================================================================
// Chart Plugin Components
// =============================================================================

interface ChartPluginCardProps {
  plugin: InstalledChartPlugin;
  onRemove: (pluginId: string) => void;
}

function ChartPluginCard({ plugin, onRemove }: ChartPluginCardProps) {
  const { manifest } = plugin;

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
      {/* Icon container */}
      <Box
        style={{
          aspectRatio: ICON_ASPECT_RATIO,
          backgroundColor: colors.primary[50],
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <IconChartBar size={48} color={colors.primary[500]} />
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
        {/* Title */}
        <Group justify="space-between" align="flex-start" mb={4}>
          <Text
            fw={typography.fontWeight.semibold}
            size="md"
            style={{ color: colors.gray[900] }}
          >
            {manifest.name}
          </Text>
          <Badge size="sm" variant="light" color="teal">
            v{manifest.version}
          </Badge>
        </Group>

        {/* Description */}
        <Text size="sm" c="dimmed" lineClamp={2} style={{ flex: 1, marginBottom: spacing.sm }}>
          {manifest.description}
        </Text>

        {/* Countries */}
        <Group gap={4} mb="sm">
          {manifest.countries.map((country) => (
            <Badge key={country} size="xs" variant="outline">
              {country.toUpperCase()}
            </Badge>
          ))}
        </Group>

        {/* Author */}
        <Text size="xs" c="dimmed" mb="sm">
          By {manifest.author}
        </Text>

        {/* Remove Button */}
        <Button
          variant="outline"
          color="red"
          size="sm"
          fullWidth
          leftSection={<IconTrash size={14} />}
          onClick={() => onRemove(manifest.id)}
        >
          Remove
        </Button>
      </Box>
    </Paper>
  );
}

interface ChartPluginInstallFormProps {
  onInstall: (repoUrl: string) => Promise<void>;
  loading: boolean;
  error: string | null;
}

function ChartPluginInstallForm({ onInstall, loading, error }: ChartPluginInstallFormProps) {
  const [url, setUrl] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim()) {
      await onInstall(url.trim());
      setUrl('');
    }
  };

  return (
    <Paper
      p="md"
      radius="md"
      style={{
        border: `1px dashed ${colors.border.medium}`,
        backgroundColor: colors.gray[50],
      }}
    >
      <form onSubmit={handleSubmit}>
        <Stack gap="sm">
          <Text fw={500} size="sm">
            Install from GitHub
          </Text>
          <Text size="xs" c="dimmed">
            Enter a GitHub repository URL containing a chart plugin (must have a manifest.json).
          </Text>
          <Group gap="sm" align="flex-end">
            <TextInput
              placeholder="https://github.com/user/chart-plugin"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              style={{ flex: 1 }}
              disabled={loading}
            />
            <Button
              type="submit"
              leftSection={loading ? <Loader size={14} /> : <IconDownload size={14} />}
              disabled={!url.trim() || loading}
            >
              {loading ? 'Installing...' : 'Install'}
            </Button>
          </Group>
          {error && (
            <Alert color="red" variant="light">
              {error}
            </Alert>
          )}
        </Stack>
      </form>
    </Paper>
  );
}

// =============================================================================
// Built-in Plugin Components
// =============================================================================

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
          color={isInstalled ? 'red' : 'teal'}
          size="sm"
          fullWidth
          onClick={handleToggle}
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

  // Chart plugins state
  const [chartPlugins, setChartPlugins] = useState<InstalledChartPlugin[]>([]);
  const [chartInstallLoading, setChartInstallLoading] = useState(false);
  const [chartInstallError, setChartInstallError] = useState<string | null>(null);

  // Subscribe to chart plugin registry changes
  useEffect(() => {
    const updateChartPlugins = () => {
      setChartPlugins(chartPluginRegistry.getAllPlugins());
    };

    // Initial load
    updateChartPlugins();

    // Subscribe to changes
    return chartPluginRegistry.subscribe(updateChartPlugins);
  }, []);

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

  // Chart plugin handlers
  const handleInstallChartPlugin = useCallback(async (repoUrl: string) => {
    setChartInstallLoading(true);
    setChartInstallError(null);

    try {
      const { manifest, code } = await chartPluginLoader.fetchFromUrl(repoUrl);

      // Check if already installed
      if (chartPluginRegistry.isInstalled(manifest.id)) {
        throw new Error(`Plugin "${manifest.name}" is already installed`);
      }

      chartPluginRegistry.install(manifest, repoUrl, code);
    } catch (error) {
      setChartInstallError(
        error instanceof Error ? error.message : 'Failed to install plugin'
      );
    } finally {
      setChartInstallLoading(false);
    }
  }, []);

  const handleRemoveChartPlugin = useCallback((pluginId: string) => {
    chartPluginRegistry.uninstall(pluginId);
  }, []);

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

      {/* Divider */}
      <Divider my="lg" />

      {/* Chart Plugins Section */}
      <Box>
        <Title order={3} mb={4} style={{ color: colors.gray[900] }}>
          <Group gap="xs">
            <IconChartBar size={20} />
            Chart Plugins
          </Group>
        </Title>
        <Text size="sm" c="dimmed" mb="md">
          Install custom chart plugins from GitHub to add new visualizations to your reports.
          {chartPlugins.length > 0 && ` ${chartPlugins.length} chart plugin(s) installed.`}
        </Text>
      </Box>

      {/* Chart Plugin Install Form */}
      <ChartPluginInstallForm
        onInstall={handleInstallChartPlugin}
        loading={chartInstallLoading}
        error={chartInstallError}
      />

      {/* Installed Chart Plugins Grid */}
      {chartPlugins.length > 0 && (
        <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
          {chartPlugins.map((plugin) => (
            <ChartPluginCard
              key={plugin.manifest.id}
              plugin={plugin}
              onRemove={handleRemoveChartPlugin}
            />
          ))}
        </SimpleGrid>
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
