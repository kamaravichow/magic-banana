'use client';

import { ActionIcon, Box, Center, Group, Image, Stack, Text, Tooltip } from '@mantine/core';
import {
    IconDownload,
    IconPhoto,
    IconResize,
    IconShare,
    IconZoomIn,
    IconZoomOut
} from '@tabler/icons-react';
import React, { useState } from 'react';

interface EditorViewProps {
  generatedImage: { data: string; mimeType: string } | null;
}

export default function EditorView({ generatedImage }: EditorViewProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [zoom, setZoom] = useState(100);

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

  const downloadImage = () => {
    if (!imageUrl || !generatedImage) return;

    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `generated-image-${Date.now()}.${generatedImage.mimeType.split('/')[1]}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 25, 300));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 25, 25));
  const handleFitToScreen = () => setZoom(100);

  return (
    <Box h="100%" style={{ position: 'relative', display: 'flex', flexDirection: 'column' }}>
      {/* Toolbar */}
      {imageUrl && (
        <Box 
          p="sm"
          style={{ 
            position: 'absolute', 
            top: 16, 
            left: 16, 
            zIndex: 10,
            backgroundColor: 'var(--background)',
            borderRadius: 12,
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
            backdropFilter: 'blur(8px)',
            border: '1px solid var(--border-color)'
          }}
        >
          <Group gap="xs">
            <Tooltip label="Zoom In">
              <ActionIcon 
                variant="subtle" 
                onClick={handleZoomIn}
                disabled={zoom >= 300}
              >
                <IconZoomIn size={16} />
              </ActionIcon>
            </Tooltip>
            
            <Text size="xs" fw={500} style={{ minWidth: '45px', textAlign: 'center' }}>
              {zoom}%
            </Text>
            
            <Tooltip label="Zoom Out">
              <ActionIcon 
                variant="subtle" 
                onClick={handleZoomOut}
                disabled={zoom <= 25}
              >
                <IconZoomOut size={16} />
              </ActionIcon>
            </Tooltip>
            
            <Tooltip label="Fit to Screen">
              <ActionIcon variant="subtle" onClick={handleFitToScreen}>
                <IconResize size={16} />
              </ActionIcon>
            </Tooltip>
            
            <Box w={1} h={20} bg="var(--border-color)" />
            
            <Tooltip label="Download">
              <ActionIcon variant="subtle" color="dark" onClick={downloadImage}>
                <IconDownload size={16} />
              </ActionIcon>
            </Tooltip>
            
            <Tooltip label="Share">
              <ActionIcon variant="subtle" color="gray">
                <IconShare size={16} />
              </ActionIcon>
            </Tooltip>
          </Group>
        </Box>
      )}

      {/* Canvas Area */}
      <Box 
        style={{ 
          flex: 1, 
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {imageUrl ? (
          <Center h="100%" p="xl">
            <Box
              style={{
                maxWidth: '100%',
                maxHeight: '100%',
                borderRadius: 16,
                overflow: 'hidden',
                boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
                backgroundColor: 'var(--background)',
                border: '1px solid var(--border-color)'
              }}
            >
              <Image
                src={imageUrl}
                alt="Generated image"
                style={{ 
                  transform: `scale(${zoom / 100})`,
                  transformOrigin: 'center',
                  transition: 'transform 0.2s ease'
                }}
                radius={16}
              />
            </Box>
          </Center>
        ) : (
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
        )}
      </Box>

      {/* Grid pattern background when no image */}
      {!imageUrl && (
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
      )}
    </Box>
  );
}
