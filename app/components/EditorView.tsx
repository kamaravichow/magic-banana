'use client';

import { Box, Center, Stack, Text } from '@mantine/core';
import { IconPhoto } from '@tabler/icons-react';
import React, { useState } from 'react';
import AdvancedImageViewer from './AdvancedImageViewer';

interface EditorViewProps {
  generatedImage: { data: string; mimeType: string } | null;
  onImageEnhanced?: (enhancedImageData: { data: string; mimeType: string }) => void;
}

export default function EditorView({ generatedImage, onImageEnhanced }: EditorViewProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  // Convert base64 image data to blob URL when new image is generated
  React.useEffect(() => {
    if (generatedImage) {
      // Clean up previous URL
      if (imageUrl) {
        URL.revokeObjectURL(imageUrl);
      }

      // Create new blob URL
      const binaryString = atob(generatedImage.data);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: generatedImage.mimeType });
      const url = URL.createObjectURL(blob);
      setImageUrl(url);

      // Cleanup function
      return () => URL.revokeObjectURL(url);
    }
  }, [generatedImage]);



  return (
    <Box h="100%" style={{ position: 'relative', display: 'flex', flexDirection: 'column' }}>
      {imageUrl ? (
        <AdvancedImageViewer
          src={imageUrl}
          alt="Generated image"
          showToolbar={true}
          showRulers={true}
          enableGestures={true}
          style={{ height: '100%' }}
          onImageEnhanced={onImageEnhanced}
        />
      ) : (
        <>
          <Center h="100%">
            <Stack align="center" gap="lg">
              <Box
                style={{
                  width: 100,
                  height: 100,
                  borderRadius: '50%',
                  backgroundColor: 'var(--secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '2px solid var(--border-color)',
                  position: 'relative'
                }}
              >
                <IconPhoto size={40} color="var(--primary)" />
                <Box
                  style={{
                    position: 'absolute',
                    width: '120%',
                    height: '120%',
                    borderRadius: '50%',
                    border: '1px solid var(--border-color)',
                    opacity: 0.2
                  }}
                />
                <Box
                  style={{
                    position: 'absolute',
                    width: '140%',
                    height: '140%',
                    borderRadius: '50%',
                    border: '1px solid var(--border-color)',
                    opacity: 0.1
                  }}
                />
              </Box>
              <Stack align="center" gap="xs">
                <Text size="lg" fw={600} c="var(--foreground)">
                  Your canvas awaits
                </Text>
                <Text c="dimmed" ta="center" maw={360} lh={1.4} size="sm">
                  Upload an image and start creating with AI. Describe what you'd like to do and watch the magic happen.
                </Text>
              </Stack>
            </Stack>
          </Center>

          {/* Grid pattern background when no image */}
          <Box
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundImage: `
                linear-gradient(var(--border-color) 1px, transparent 1px),
                linear-gradient(90deg, var(--border-color) 1px, transparent 1px)
              `,
              backgroundSize: '20px 20px',
              pointerEvents: 'none',
              zIndex: -1
            }}
          />
        </>
      )}
    </Box>
  );
}
