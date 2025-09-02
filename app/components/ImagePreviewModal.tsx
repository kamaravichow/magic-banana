'use client';

import { ActionIcon, Box, Group, Modal, Text } from '@mantine/core';
import { IconExternalLink } from '@tabler/icons-react';
import AdvancedImageViewer from './AdvancedImageViewer';

interface ImagePreviewModalProps {
  src: string | null;
  alt?: string;
  opened: boolean;
  onClose: () => void;
  title?: string;
  onImageEnhanced?: (enhancedImageData: { data: string; mimeType: string }) => void;
}

export default function ImagePreviewModal({
  src,
  alt = "Image preview",
  opened,
  onClose,
  title,
  onImageEnhanced
}: ImagePreviewModalProps) {
  if (!src) return null;

  const openInNewTab = () => {
    window.open(src, '_blank');
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      size="95vw"
      styles={{
        modal: {
          height: '95vh',
          maxHeight: '95vh',
          padding: 0
        },
        body: {
          height: '100%',
          padding: 0
        },
        header: {
          padding: '16px 20px',
          borderBottom: '1px solid var(--border-color)',
          backgroundColor: 'var(--background)'
        }
      }}
      title={
        <Group justify="space-between" style={{ width: '100%' }}>
          <Text fw={600} size="lg">
            {title || "Image Preview"}
          </Text>
          <Group gap="xs">
            <ActionIcon
              variant="subtle"
              color="gray"
              onClick={openInNewTab}
              size="sm"
            >
              <IconExternalLink size={16} />
            </ActionIcon>
          </Group>
        </Group>
      }
      closeButtonProps={{
        size: 'sm',
        variant: 'subtle'
      }}
    >
      <Box style={{ height: 'calc(95vh - 70px)', position: 'relative' }}>
        <AdvancedImageViewer
          src={src}
          alt={alt}
          showToolbar={true}
          showRulers={true}
          enableGestures={true}
          onImageEnhanced={onImageEnhanced}
        />
      </Box>
    </Modal>
  );
}
