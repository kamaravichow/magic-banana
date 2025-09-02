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
  replicateApiKey: string;
}

export default function SettingsModal({ opened, onClose }: SettingsModalProps) {
  const form = useForm<SettingsFormData>({
    initialValues: {
      geminiApiKey: '',
      replicateApiKey: '',
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
      replicateApiKey: (value) => {
        if (!value.trim()) return null; // Allow empty for using default
        if (!value.startsWith('r8_')) {
          return 'Replicate API key should start with "r8_"';
        }
        if (value.length < 40) {
          return 'API key appears to be too short';
        }
        return null;
      },
    },
  });

  // Load existing API keys from cookies when modal opens
  useEffect(() => {
    if (opened) {
      const existingGeminiKey = cookieUtils.get(COOKIE_NAMES.GEMINI_API_KEY);
      const existingReplicateKey = cookieUtils.get(COOKIE_NAMES.REPLICATE_API_KEY);
      form.setFieldValue('geminiApiKey', existingGeminiKey || '');
      form.setFieldValue('replicateApiKey', existingReplicateKey || '');
    }
  }, [opened]);

  const handleSave = (values: SettingsFormData) => {
    if (values.geminiApiKey.trim()) {
      // Save the Gemini API key to cookie
      cookieUtils.set(COOKIE_NAMES.GEMINI_API_KEY, values.geminiApiKey.trim(), 90); // 90 days
    } else {
      // Remove the cookie if empty (use default)
      cookieUtils.delete(COOKIE_NAMES.GEMINI_API_KEY);
    }

    if (values.replicateApiKey.trim()) {
      // Save the Replicate API key to cookie
      cookieUtils.set(COOKIE_NAMES.REPLICATE_API_KEY, values.replicateApiKey.trim(), 90); // 90 days
    } else {
      // Remove the cookie if empty (use default)
      cookieUtils.delete(COOKIE_NAMES.REPLICATE_API_KEY);
    }
    
    onClose();
  };

  const handleClearGeminiKey = () => {
    form.setFieldValue('geminiApiKey', '');
    cookieUtils.delete(COOKIE_NAMES.GEMINI_API_KEY);
  };

  const handleClearReplicateKey = () => {
    form.setFieldValue('replicateApiKey', '');
    cookieUtils.delete(COOKIE_NAMES.REPLICATE_API_KEY);
  };

  const hasExistingGeminiKey = cookieUtils.exists(COOKIE_NAMES.GEMINI_API_KEY);
  const hasExistingReplicateKey = cookieUtils.exists(COOKIE_NAMES.REPLICATE_API_KEY);

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
            title="Custom API Keys"
            color="blue"
            variant="light"
          >
            <Text size="sm">
              Enter your own API keys to use instead of the default ones. 
              Leave empty to use the default keys. Your keys will be stored locally in your browser.
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

          <PasswordInput
            label="Replicate API Key (for Image Enhancement)"
            placeholder="r8_..."
            leftSection={<IconKey size={16} />}
            description="Get your API key from Replicate dashboard for image enhancement features"
            {...form.getInputProps('replicateApiKey')}
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

          {(hasExistingGeminiKey || hasExistingReplicateKey) && (
            <Alert
              color="green"
              variant="light"
            >
              <Text size="sm">
                {hasExistingGeminiKey && '✓ Custom Gemini API key is saved'}
                {hasExistingGeminiKey && hasExistingReplicateKey && <br />}
                {hasExistingReplicateKey && '✓ Custom Replicate API key is saved'}
              </Text>
            </Alert>
          )}

          <Group justify="space-between" mt="md">
            <Group>
              {hasExistingGeminiKey && (
                <Button
                  variant="light"
                  color="red"
                  size="sm"
                  onClick={handleClearGeminiKey}
                >
                  Clear Gemini Key
                </Button>
              )}
              {hasExistingReplicateKey && (
                <Button
                  variant="light"
                  color="red"
                  size="sm"
                  onClick={handleClearReplicateKey}
                >
                  Clear Replicate Key
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
