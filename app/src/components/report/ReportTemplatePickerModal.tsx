import { useState } from 'react';
import {
  Modal,
  Stack,
  Text,
  TextInput,
  Group,
  Paper,
  ScrollArea,
  Button,
  Box,
  Divider,
} from '@mantine/core';
import { IconSearch, IconSparkles } from '@tabler/icons-react';
import {
  getTemplateCategories,
  getTemplatesByCategory,
  type ReportElementTemplate,
} from '@/api/v2/reportElementTemplates';

interface ReportTemplatePickerModalProps {
  opened: boolean;
  onClose: () => void;
  onSelect: (template: ReportElementTemplate) => void;
  onCustomAnalysis?: () => void;
}

export default function ReportTemplatePickerModal({
  opened,
  onClose,
  onSelect,
  onCustomAnalysis,
}: ReportTemplatePickerModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const categories = getTemplateCategories();

  // Get templates to display
  const templates = selectedCategory
    ? getTemplatesByCategory(selectedCategory as any)
    : categories.flatMap((cat) => getTemplatesByCategory(cat.id));

  // Filter by search
  const filteredTemplates = templates.filter(
    (template) =>
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelect = (template: ReportElementTemplate) => {
    onSelect(template);
    onClose();
    setSearchQuery('');
    setSelectedCategory(null);
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Add from template"
      size="lg"
      styles={{
        body: { padding: 0 },
      }}
    >
      <Stack gap={0}>
        {/* Search */}
        <Box px="lg" pt="md" pb="sm">
          <TextInput
            placeholder="Search templates..."
            leftSection={<IconSearch size={16} />}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </Box>

        {/* Categories */}
        <ScrollArea.Autosize mah={40} px="lg" pb="sm">
          <Group gap="sm" wrap="nowrap">
            <Text
              size="sm"
              fw={selectedCategory === null ? 600 : 400}
              c={selectedCategory === null ? 'blue' : 'dimmed'}
              style={{ cursor: 'pointer', whiteSpace: 'nowrap' }}
              onClick={() => setSelectedCategory(null)}
            >
              All
            </Text>
            {categories.map((cat) => (
              <Text
                key={cat.id}
                size="sm"
                fw={selectedCategory === cat.id ? 600 : 400}
                c={selectedCategory === cat.id ? 'blue' : 'dimmed'}
                style={{ cursor: 'pointer', whiteSpace: 'nowrap' }}
                onClick={() => setSelectedCategory(cat.id)}
              >
                {cat.name}
              </Text>
            ))}
          </Group>
        </ScrollArea.Autosize>

        <Divider />

        {/* Templates */}
        <ScrollArea h={400} px="lg" py="md">
          {filteredTemplates.length === 0 ? (
            <Text c="dimmed" ta="center" py="xl">
              No templates found
            </Text>
          ) : (
            <Stack gap="xs">
              {filteredTemplates.map((template) => (
                <Paper
                  key={template.id}
                  p="md"
                  withBorder
                  style={{
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'var(--mantine-color-blue-5)';
                    e.currentTarget.style.backgroundColor = 'var(--mantine-color-gray-0)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--mantine-color-gray-3)';
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                  onClick={() => handleSelect(template)}
                >
                  <Box style={{ flex: 1, minWidth: 0 }}>
                    <Text fw={500} mb={4}>
                      {template.name}
                    </Text>
                    <Text size="sm" c="dimmed" lineClamp={2}>
                      {template.description}
                    </Text>
                  </Box>
                </Paper>
              ))}
            </Stack>
          )}
        </ScrollArea>

        <Divider />

        {/* Footer */}
        <Group justify="space-between" p="md">
          <Button
            variant="subtle"
            leftSection={<IconSparkles size={16} />}
            onClick={() => {
              onClose();
              onCustomAnalysis?.();
            }}
          >
            Custom analysis (AI)
          </Button>
          <Button variant="subtle" onClick={onClose}>
            Cancel
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}