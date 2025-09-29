import { useState, useEffect } from 'react';
import {
  Paper,
  Group,
  ActionIcon,
  Menu,
  Textarea,
  Text,
  Box,
  rem,
  useMantineTheme,
} from '@mantine/core';
import {
  IconGripVertical,
  IconDotsVertical,
  IconTrash,
  IconArrowUp,
  IconArrowDown,
  IconEdit,
  IconCheck,
  IconX,
} from '@tabler/icons-react';
import { ReportElement } from '@/api/v2/reportElements';
import ReactMarkdown from 'react-markdown';
import DataElementCell from './DataElementCell';

interface ReportElementCellProps {
  element: ReportElement;
  onUpdate: (content: any) => void;
  onDelete: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
}

export default function ReportElementCell({
  element,
  onUpdate,
  onDelete,
  onMoveUp,
  onMoveDown,
}: ReportElementCellProps) {
  const theme = useMantineTheme();
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (element.type === 'markdown') {
      // Markdown content is stored in the markdown_content field
      setEditContent(element.markdown_content || '');
    }
  }, [element]);

  const handleStartEdit = () => {
    setIsEditing(true);
    setHasChanges(false);
  };

  const handleSave = () => {
    if (element.type === 'markdown' && hasChanges) {
      console.log('Saving markdown content:', editContent);
      onUpdate(editContent); // Send the text directly
      setHasChanges(false);
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    if (element.type === 'markdown') {
      setEditContent(element.markdown_content || '');
    }
    setIsEditing(false);
    setHasChanges(false);
  };

  const handleContentChange = (value: string) => {
    setEditContent(value);
    setHasChanges(true);
    // No autosave - user must click save button
  };

  const renderContent = () => {
    if (element.type === 'markdown') {
      const content = element.markdown_content || '';

      if (isEditing) {
        return (
          <Box>
            <Textarea
              value={editContent}
              onChange={(e) => handleContentChange(e.currentTarget.value)}
              minRows={4}
              maxRows={20}
              autosize
              styles={{
                input: {
                  fontFamily: 'monospace',
                  fontSize: rem(14),
                },
              }}
              placeholder="Enter markdown text..."
            />
          </Box>
        );
      }

      return (
        <Box
          className="markdown-content"
          style={{
            minHeight: rem(40),
            padding: isEditing ? 0 : rem(8),
          }}
        >
          {content ? (
            <ReactMarkdown>{content}</ReactMarkdown>
          ) : (
            <Text color="dimmed" style={{ fontStyle: 'italic' }}>
              Empty section
            </Text>
          )}
        </Box>
      );
    }

    if (element.type === 'data') {
      // For data elements, we display the visualization
      return (
        <DataElementCell
          element={element}
          isEditing={isEditing}
        />
      );
    }

    // Placeholder for other element types
    return (
      <Text color="dimmed" style={{ fontStyle: 'italic' }}>
        {element.type} element (not yet implemented)
      </Text>
    );
  };

  return (
    <Paper
      withBorder={isEditing}
      p={isEditing ? "md" : 0}
      style={{
        position: 'relative',
        border: isEditing ? undefined : 'none',
        backgroundColor: isEditing ? undefined : 'transparent'
      }}
    >
      {isEditing && (
        <Group justify="space-between" mb="sm">
          <Group gap="xs">
            <IconGripVertical
              size={18}
              style={{ color: theme.colors.gray[5], cursor: 'grab' }}
            />
            <Text size="xs" color="dimmed">
              {element.type.charAt(0).toUpperCase() + element.type.slice(1)}
            </Text>
          </Group>

          <Group gap="xs">
            <ActionIcon
              size="sm"
              variant="filled"
              color="blue"
              onClick={handleSave}
              title="Save"
            >
              <IconCheck size={14} />
            </ActionIcon>
            <ActionIcon
              size="sm"
              variant="subtle"
              onClick={handleCancel}
              title="Cancel"
            >
              <IconX size={14} />
            </ActionIcon>
          </Group>
        </Group>
      )}

      {!isEditing && element.type === 'markdown' && (
        <ActionIcon
          size="sm"
          variant="subtle"
          onClick={handleStartEdit}
          title="Edit"
          style={{
            position: 'absolute',
            top: 8,
            right: 38,
            opacity: 0,
            transition: 'opacity 150ms ease',
            zIndex: 10,
          }}
          className="edit-button"
        >
          <IconEdit size={14} />
        </ActionIcon>
      )}

      {!isEditing && (
        <Menu shadow="md" width={150} position="bottom-end">
          <Menu.Target>
            <ActionIcon
              size="sm"
              variant="subtle"
              style={{
                position: 'absolute',
                top: 8,
                right: 8,
                opacity: 0,
                transition: 'opacity 150ms ease',
                zIndex: 10,
              }}
              className="menu-button"
            >
              <IconDotsVertical size={14} />
            </ActionIcon>
          </Menu.Target>
          <Menu.Dropdown>
            {onMoveUp && (
              <Menu.Item
                leftSection={<IconArrowUp size={14} />}
                onClick={onMoveUp}
              >
                Move up
              </Menu.Item>
            )}
            {onMoveDown && (
              <Menu.Item
                leftSection={<IconArrowDown size={14} />}
                onClick={onMoveDown}
              >
                Move down
              </Menu.Item>
            )}
            {(onMoveUp || onMoveDown) && <Menu.Divider />}
            <Menu.Item
              color="red"
              leftSection={<IconTrash size={14} />}
              onClick={onDelete}
            >
              Delete
            </Menu.Item>
          </Menu.Dropdown>
        </Menu>
      )}

      <style>{`
        .mantine-Paper-root:hover .edit-button,
        .mantine-Paper-root:hover .menu-button {
          opacity: 1 !important;
        }
      `}</style>

      {renderContent()}
    </Paper>
  );
}