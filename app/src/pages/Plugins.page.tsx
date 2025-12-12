/**
 * Plugins Page
 *
 * Displays available plugins with install/remove functionality.
 * Plugin installation state is stored in sessionStorage.
 */

import { useCallback, useState } from 'react';
import { Box, Button, Container, SimpleGrid, Text } from '@mantine/core';
import HeroSection from '@/components/shared/static/HeroSection';
import StaticPageLayout from '@/components/shared/static/StaticPageLayout';
import { plugins } from '@/data/plugins/pluginTransformers';
import { colors, spacing } from '@/designTokens';
import type { Plugin } from '@/types/plugin';
import {
  addInstalledPlugin,
  getInstalledPlugins,
  removeInstalledPlugin,
} from '@/utils/pluginStorage';

interface PluginCardProps {
  plugin: Plugin;
  isInstalled: boolean;
  onToggle: (slug: string, installed: boolean) => void;
}

function PluginCard({ plugin, isInstalled, onToggle }: PluginCardProps) {
  const formattedDateCreated = new Date(plugin.dateCreated).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  const formattedDateUpdated = new Date(plugin.dateUpdated).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  const handleToggle = () => {
    onToggle(plugin.slug, !isInstalled);
  };

  return (
    <Box
      style={{
        border: `1px solid ${colors.gray[300]}`,
        borderRadius: spacing.radius.md,
        overflow: 'hidden',
        backgroundColor: colors.white,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        transition: 'box-shadow 0.2s ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = `0 4px 12px ${colors.gray[300]}`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      {/* Image */}
      <Box
        style={{
          height: '160px',
          overflow: 'hidden',
          backgroundColor: colors.gray[100],
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
          padding: spacing.lg,
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Title */}
        <Text fw={600} size="lg" mb="xs" style={{ color: colors.gray[900] }}>
          {plugin.name}
        </Text>

        {/* Description */}
        <Text size="sm" c="dimmed" lineClamp={3} style={{ flex: 1 }}>
          {plugin.description}
        </Text>

        {/* Dates */}
        <Box mt="sm">
          <Text size="xs" c="dimmed">
            Created: {formattedDateCreated}
          </Text>
          <Text size="xs" c="dimmed">
            Updated: {formattedDateUpdated}
          </Text>
        </Box>

        {/* Install/Remove Button */}
        <Button
          mt="md"
          variant={isInstalled ? 'outline' : 'filled'}
          color={isInstalled ? 'red' : 'teal'}
          fullWidth
          onClick={handleToggle}
        >
          {isInstalled ? 'Remove plugin' : 'Install plugin'}
        </Button>
      </Box>
    </Box>
  );
}

export default function PluginsPage() {
  // Initialize installed plugins from sessionStorage
  const [installedPlugins, setInstalledPlugins] = useState<string[]>(() => getInstalledPlugins());

  const handleTogglePlugin = useCallback((slug: string, shouldInstall: boolean) => {
    if (shouldInstall) {
      const updated = addInstalledPlugin(slug);
      setInstalledPlugins(updated);
    } else {
      const updated = removeInstalledPlugin(slug);
      setInstalledPlugins(updated);
    }
  }, []);

  const checkIsInstalled = useCallback(
    (slug: string) => {
      return installedPlugins.includes(slug);
    },
    [installedPlugins]
  );

  const installedCount = installedPlugins.length;

  return (
    <StaticPageLayout title="Plugins">
      <HeroSection
        title="Plugins"
        description="Enhance your PolicyEngine experience with optional plugins. Install plugins to add new features and customize your workflow."
      />

      <Container size="xl" py="xl">
        {/* Stats */}
        <Text size="sm" c="dimmed" mb="md">
          {plugins.length} {plugins.length === 1 ? 'plugin' : 'plugins'} available
          {installedCount > 0 && ` (${installedCount} installed)`}
        </Text>

        {/* Plugin Grid */}
        {plugins.length > 0 ? (
          <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="lg">
            {plugins.map((plugin) => (
              <PluginCard
                key={plugin.slug}
                plugin={plugin}
                isInstalled={checkIsInstalled(plugin.slug)}
                onToggle={handleTogglePlugin}
              />
            ))}
          </SimpleGrid>
        ) : (
          <Box
            style={{
              textAlign: 'center',
              padding: spacing['3xl'],
              backgroundColor: colors.gray[50],
              borderRadius: spacing.radius.md,
            }}
          >
            <Text c="dimmed">No plugins available yet.</Text>
          </Box>
        )}
      </Container>
    </StaticPageLayout>
  );
}
