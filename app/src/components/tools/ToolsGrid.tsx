/**
 * ToolsGrid Component
 *
 * Grid layout for tool cards, matching BlogPostGrid pattern.
 */

import { SimpleGrid } from '@mantine/core';
import type { App } from '@/types/apps';
import { ToolCard } from './ToolCard';

interface ToolsGridProps {
  apps: App[];
}

export function ToolsGrid({ apps }: ToolsGridProps) {
  return (
    <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="lg">
      {apps.map((app) => (
        <ToolCard key={app.slug} app={app} />
      ))}
    </SimpleGrid>
  );
}
