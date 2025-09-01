'use client';

import { ActionIcon, AppShell, Group, Text } from '@mantine/core';
import { IconHelp, IconPalette, IconSettings } from '@tabler/icons-react';
import { useState } from 'react';
import ChatInterface from './components/ChatInterface';
import EditorView from './components/EditorView';

export default function Home() {
  const [generatedImage, setGeneratedImage] = useState<{ data: string; mimeType: string } | null>(null);

  const handleImageGenerated = (imageData: { data: string; mimeType: string }) => {
    setGeneratedImage(imageData);
  };

  return (
    <AppShell
      header={{ height: 60 }}
      aside={{ width: 350, breakpoint: 'sm' }}
      padding={0}
    >
      <AppShell.Header px="md">
        <Group h="100%" justify="space-between">
          <Group>
            <IconPalette size={24} color="var(--primary)" />
            <Text size="xl" fw={700} c="var(--primary)">MagicBanana</Text>
          </Group>
          <Group>
            <ActionIcon variant="subtle" size="lg">
              <IconSettings size={18} />
            </ActionIcon>
            <ActionIcon variant="subtle" size="lg">
              <IconHelp size={18} />
            </ActionIcon>
          </Group>
        </Group>
      </AppShell.Header>

      <AppShell.Main style={{ backgroundColor: 'var(--canvas-bg)', height: 'calc(100vh - 60px)' }}>
        <EditorView generatedImage={generatedImage} />
      </AppShell.Main>

      <AppShell.Aside 
        style={{ 
          borderLeft: '1px solid var(--border-color)',
          backgroundColor: 'var(--sidebar-bg)',
          boxShadow: '-4px 0 15px -3px rgba(0, 0, 0, 0.05)'
        }}
      >
        <ChatInterface onImageGenerated={handleImageGenerated} />
      </AppShell.Aside>
    </AppShell>
  );
}