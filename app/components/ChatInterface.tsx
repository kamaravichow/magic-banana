'use client';

import { ActionIcon, Avatar, Badge, Box, FileButton, Group, Image, ScrollArea, Stack, Text, Textarea } from '@mantine/core';
import { IconPhoto, IconRobot, IconSend, IconSparkles, IconUser, IconX } from '@tabler/icons-react';
import { useRef, useState } from 'react';

interface Message {
  id: string;
  type: 'user' | 'assistant';
  text: string;
  image?: string;
  timestamp: Date;
}

interface ChatInterfaceProps {
  onImageGenerated: (imageData: { data: string; mimeType: string }) => void;
}

export default function ChatInterface({ onImageGenerated }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [inputImage, setInputImage] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const resetRef = useRef<() => void>(null);

  const handleImageUpload = (file: File | null) => {
    setInputImage(file);
  };

  const removeImage = () => {
    setInputImage(null);
    resetRef.current?.();
  };

  const sendMessage = async () => {
    if (!inputText.trim() && !inputImage) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      text: inputText,
      image: inputImage ? URL.createObjectURL(inputImage) : undefined,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append('prompt', inputText);
      if (inputImage) {
        formData.append('image', inputImage);
      }

      const response = await fetch('/api/generate-image', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to generate image');
      }

      const result = await response.json();

      if (result.image) {
        onImageGenerated(result.image);
      }

      if (result.text) {
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          type: 'assistant',
          text: result.text,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, assistantMessage]);
      }

    } catch (error) {
      console.error('Error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        text: 'Sorry, there was an error generating the image.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      setInputText('');
      setInputImage(null);
      resetRef.current?.();
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  };

  return (
    <Box h="100%" style={{ display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box p="md" style={{ borderBottom: '1px solid var(--border-color)' }}>
        <Group>
          <IconSparkles size={20} color="var(--primary)" />
          <Text size="md" fw={600}>AI Assistant</Text>
          <Badge size="xs" color="gray" variant="light">Online</Badge>
        </Group>
      </Box>
      
      {/* Messages */}
      <ScrollArea 
        style={{ flex: 1 }} 
        p="md" 
        scrollbars="y"
        offsetScrollbars
      >
        <Stack gap="md">
          {messages.length === 0 && (
            <Box ta="center" py="lg">
              <Stack gap="md" align="center">
                <Box
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: '50%',
                    backgroundColor: 'var(--secondary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '1px solid var(--border-color)',
                    position: 'relative'
                  }}
                >
                  <IconSparkles size={24} color="var(--primary)" />
                  <Box
                    style={{
                      position: 'absolute',
                      width: '100%',
                      height: '100%',
                      borderRadius: '50%',
                      background: `conic-gradient(from 0deg, transparent, var(--border-color), transparent)`,
                      animation: 'spin 8s linear infinite',
                      opacity: 0.3
                    }}
                  />
                </Box>
                <Stack gap="xs" align="center">
                  <Text size="sm" fw={500} c="var(--foreground)">
                    Ready to create
                  </Text>
                  <Text size="xs" c="dimmed" maw={260} ta="center" lh={1.3}>
                    Upload an image and describe what you'd like me to do with it
                  </Text>
                </Stack>
              </Stack>
            </Box>
          )}
          {messages.map((message) => (
            <Group
              key={message.id}
              align="flex-start"
              gap="sm"
              style={{ 
                flexDirection: message.type === 'user' ? 'row-reverse' : 'row',
              }}
            >
              <Avatar 
                size={32}
                color={message.type === 'user' ? 'dark' : 'gray'}
                style={{ flexShrink: 0 }}
              >
                {message.type === 'user' ? <IconUser size={16} /> : <IconRobot size={16} />}
              </Avatar>
              
              <Box
                style={{
                  backgroundColor: message.type === 'user' ? 'var(--primary)' : 'var(--secondary)',
                  color: message.type === 'user' ? 'var(--background)' : 'var(--foreground)',
                  borderRadius: 16,
                  padding: '12px 16px',
                  maxWidth: '85%',
                  wordBreak: 'break-word',
                  border: message.type === 'assistant' ? '1px solid var(--border-color)' : 'none'
                }}
              >
                {message.image && (
                  <Image
                    src={message.image}
                    alt="User uploaded image"
                    maw={180}
                    mb="xs"
                    radius="sm"
                  />
                )}
                <Text size="sm">{message.text}</Text>
                <Text 
                  size="xs" 
                  style={{ 
                    opacity: 0.7,
                    marginTop: 4
                  }}
                >
                  {message.timestamp.toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </Text>
              </Box>
            </Group>
          ))}
          {isLoading && (
            <Group align="flex-start" gap="sm">
              <Avatar size={32} color="gray">
                <IconRobot size={16} />
              </Avatar>
              <Box
                style={{
                  backgroundColor: 'var(--secondary)',
                  borderRadius: 16,
                  padding: '12px 16px',
                  border: '1px solid var(--border-color)'
                }}
              >
                <Text size="sm" c="dimmed">Generating...</Text>
              </Box>
            </Group>
          )}
        </Stack>
      </ScrollArea>

      {/* Input Area */}
      <Box p="md" style={{ borderTop: '1px solid var(--border-color)' }}>
        <Stack gap="xs">
          {inputImage && (
            <Box
              p="xs"
              style={{
                backgroundColor: 'var(--secondary)',
                borderRadius: 8,
                border: '1px solid var(--border-color)'
              }}
            >
              <Group justify="space-between" align="center">
                <Group gap="xs">
                  <Image
                    src={URL.createObjectURL(inputImage)}
                    alt="Selected image"
                    w={30}
                    h={30}
                    radius={4}
                  />
                  <Text size="xs" c="dimmed" truncate maw={150}>
                    {inputImage.name}
                  </Text>
                </Group>
                <ActionIcon size="sm" variant="subtle" color="red" onClick={removeImage}>
                  <IconX size={12} />
                </ActionIcon>
              </Group>
            </Box>
          )}
          
          <Group align="flex-end" gap="xs">
            <Textarea
              placeholder="Describe what you want to do..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyPress}
              autosize
              minRows={1}
              maxRows={3}
              style={{ flex: 1 }}
              disabled={isLoading}
              size="sm"
            />
            <Group gap={4}>
              <FileButton
                resetRef={resetRef}
                onChange={handleImageUpload}
                accept="image/*"
              >
                {(props) => (
                  <ActionIcon {...props} variant="light" size="lg" color="gray">
                    <IconPhoto size={16} />
                  </ActionIcon>
                )}
              </FileButton>
              <ActionIcon
                size="lg"
                color="dark"
                onClick={sendMessage}
                loading={isLoading}
                disabled={!inputText.trim() && !inputImage}
              >
                <IconSend size={16} />
              </ActionIcon>
            </Group>
          </Group>
        </Stack>
      </Box>
    </Box>
  );
}
