/**
 * Plugin Settings Modal
 *
 * Renders a modal for configuring plugin settings.
 * Dynamically generates form controls based on the plugin's settings schema.
 */

import { useEffect, useState } from 'react';
import {
  Button,
  Group,
  Modal,
  NumberInput,
  Select,
  Stack,
  Switch,
  Text,
  TextInput,
} from '@mantine/core';
import type { Plugin, PluginSetting, PluginSettingsValues } from '@/types/plugin';

interface PluginSettingsModalProps {
  /** Whether the modal is open */
  opened: boolean;
  /** Callback when modal is closed */
  onClose: () => void;
  /** The plugin being configured */
  plugin: Plugin;
  /** Current settings values */
  currentSettings: PluginSettingsValues;
  /** Callback when settings are saved */
  onSave: (settings: PluginSettingsValues) => Promise<void>;
}

/**
 * Renders a single setting control based on its type
 */
function SettingControl({
  setting,
  value,
  onChange,
}: {
  setting: PluginSetting;
  value: string | boolean | number;
  onChange: (value: string | boolean | number) => void;
}) {
  switch (setting.type) {
    case 'select':
      return (
        <Select
          label={setting.label}
          description={setting.description}
          data={
            setting.options?.map((opt) => ({
              value: opt.value,
              label: opt.label,
            })) || []
          }
          value={value as string}
          onChange={(val) => onChange(val || setting.defaultValue)}
        />
      );

    case 'toggle':
      return (
        <Switch
          label={setting.label}
          description={setting.description}
          checked={value as boolean}
          onChange={(e) => onChange(e.currentTarget.checked)}
        />
      );

    case 'text':
      return (
        <TextInput
          label={setting.label}
          description={setting.description}
          value={value as string}
          onChange={(e) => onChange(e.currentTarget.value)}
        />
      );

    case 'number':
      return (
        <NumberInput
          label={setting.label}
          description={setting.description}
          value={value as number}
          onChange={(val) => onChange(val || 0)}
        />
      );

    default:
      return null;
  }
}

export function PluginSettingsModal({
  opened,
  onClose,
  plugin,
  currentSettings,
  onSave,
}: PluginSettingsModalProps) {
  // Local state for editing
  const [settings, setSettings] = useState<PluginSettingsValues>(currentSettings);
  const [isSaving, setIsSaving] = useState(false);

  // Reset local state when modal opens or settings change
  useEffect(() => {
    if (opened) {
      setSettings(currentSettings);
    }
  }, [opened, currentSettings]);

  const handleChange = (key: string, value: string | boolean | number) => {
    setSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(settings);
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setSettings(currentSettings);
    onClose();
  };

  // No settings to configure
  if (!plugin.settings || plugin.settings.length === 0) {
    return (
      <Modal opened={opened} onClose={onClose} title={`${plugin.name} Settings`}>
        <Text c="dimmed">This plugin has no configurable settings.</Text>
      </Modal>
    );
  }

  return (
    <Modal opened={opened} onClose={handleCancel} title={`${plugin.name} Settings`} size="md">
      <Stack gap="md">
        {plugin.settings.map((setting) => (
          <SettingControl
            key={setting.key}
            setting={setting}
            value={settings[setting.key] ?? setting.defaultValue}
            onChange={(value) => handleChange(setting.key, value)}
          />
        ))}

        <Group justify="flex-end" mt="md">
          <Button variant="subtle" onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleSave} loading={isSaving}>
            Save
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}

export default PluginSettingsModal;
