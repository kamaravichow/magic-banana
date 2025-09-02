'use client';

import {
    Alert,
    Button,
    Group,
    Modal,
    PasswordInput,
    Stack,
    Text
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconInfoCircle, IconKey } from '@tabler/icons-react';
import { useEffect } from 'react';
import { COOKIE_NAMES, cookieUtils } from '../utils/cookies';

interface SettingsModalProps {
  opened: boolean;
  onClose: () => void;
}

interface SettingsFormData {
  geminiApiKey: string;
}

export default function SettingsModal({ opened, onClose }: SettingsModalProps) {
  const form = useForm<SettingsFormData>({
    initialValues: {
      geminiApiKey: '',
    },
    validate: {
      geminiApiKey: (value) => {
        if (!value.trim()) return null; // Allow empty for using default
        if (!value.startsWith('AIza')) {
          return 'Gemini API key should start with "AIza"';
        }
        if (value.length < 30) {
          return 'API key appears to be too short';
        }
        return null;
      },
    },
  });

  // Load existing API key from cookie when modal opens
  useEffect(() => {
    if (opened) {
      const existingKey = cookieUtils.get(COOKIE_NAMES.GEMINI_API_KEY);
      form.setFieldValue('geminiApiKey', existingKey || '');
    }
  }, [opened]);

  const handleSave = (values: SettingsFormData) => {
    if (values.geminiApiKey.trim()) {
      // Save the API key to cookie
      cookieUtils.set(COOKIE_NAMES.GEMINI_API_KEY, values.geminiApiKey.trim(), 90); // 90 days
    } else {
      // Remove the cookie if empty (use default)
      cookieUtils.delete(COOKIE_NAMES.GEMINI_API_KEY);
    }
    
    onClose();
  };

  const handleClearKey = () => {
    form.setFieldValue('geminiApiKey', '');
    cookieUtils.delete(COOKIE_NAMES.GEMINI_API_KEY);
  };

  const hasExistingKey = cookieUtils.exists(COOKIE_NAMES.GEMINI_API_KEY);

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Settings"
      size="md"
      styles={{
        content: {
          backgroundColor: 'var(--sidebar-bg)',
        },
        header: {
          backgroundColor: 'var(--sidebar-bg)',
          borderBottom: '1px solid var(--border-color)',
        },
        title: {
          fontSize: '18px',
          fontWeight: 600,
          color: 'var(--foreground)',
        },
      }}
    >
      <form onSubmit={form.onSubmit(handleSave)}>
        <Stack gap="md">
          <Alert
            icon={<IconInfoCircle size={16} />}
            title="Custom API Key"
            color="blue"
            variant="light"
          >
            <Text size="sm">
              Enter your own Gemini API key to use instead of the default one. 
              Leave empty to use the default key. Your key will be stored locally in your browser.
            </Text>
          </Alert>

          <PasswordInput
            label="Gemini API Key"
            placeholder="AIza..."
            leftSection={<IconKey size={16} />}
            description="Get your API key from Google AI Studio"
            {...form.getInputProps('geminiApiKey')}
            styles={{
              label: {
                color: 'var(--foreground)',
                fontSize: '14px',
                fontWeight: 500,
              },
              description: {
                color: 'var(--primary-light)',
                fontSize: '12px',
              },
              input: {
                backgroundColor: 'var(--secondary)',
                border: '1px solid var(--border-color)',
                color: 'var(--foreground)',
                '&:focus': {
                  borderColor: 'var(--primary)',
                },
              },
            }}
          />

          {hasExistingKey && (
            <Alert
              color="green"
              variant="light"
            >
              <Text size="sm">
                ✓ Custom API key is currently saved and will be used for requests.
              </Text>
            </Alert>
          )}

          <Group justify="space-between" mt="md">
            <Group>
              {hasExistingKey && (
                <Button
                  variant="light"
                  color="red"
                  size="sm"
                  onClick={handleClearKey}
                >
                  Clear Saved Key
                </Button>
              )}
            </Group>
            
            <Group>
              <Button 
                variant="light" 
                onClick={onClose}
                color="gray"
                styles={{
                  root: {
                    color: 'var(--foreground)',
                    backgroundColor: 'var(--secondary)',
                    border: '1px solid var(--border-color)',
                    '&:hover': {
                      backgroundColor: 'var(--tertiary)',
                    },
                  },
                }}
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                variant="filled"
                color="dark"
                styles={{
                  root: {
                    backgroundColor: 'var(--primary)',
                    color: 'var(--background)',
                    '&:hover': {
                      backgroundColor: 'var(--primary-light)',
                    },
                  },
                }}
              >
                Save Settings
              </Button>
            </Group>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}
