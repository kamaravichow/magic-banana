'use client';

import { ActionIcon, Avatar, Badge, Box, Divider, FileButton, Group, Image, Modal, ScrollArea, Stack, Table, Text, Textarea } from '@mantine/core';
import { IconInfoCircle, IconPhoto, IconRobot, IconSend, IconSparkles, IconUser, IconX } from '@tabler/icons-react';
import { useRef, useState } from 'react';

interface CostInfo {
  inputTokens: number;
  outputTokens: number;
  imageTokens: number;
  totalTokens: number;
  inputCost: number;
  outputCost: number;
  imageCost: number;
  totalCost: number;
  formattedCost: string;
}

interface Message {
  id: string;
  type: 'user' | 'assistant';
  text: string;
  image?: string;
  timestamp: Date;
  cost?: CostInfo;
}

interface ChatInterfaceProps {
  onImageGenerated: (imageData: { data: string; mimeType: string }) => void;
}

export default function ChatInterface({ onImageGenerated }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [inputImage, setInputImage] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [costModalOpen, setCostModalOpen] = useState(false);
  const [selectedMessageCost, setSelectedMessageCost] = useState<CostInfo | null>(null);
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
          cost: result.cost || undefined,
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

  const openCostModal = (cost: CostInfo) => {
    setSelectedMessageCost(cost);
    setCostModalOpen(true);
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
        p="lg" 
        scrollbars="y"
        offsetScrollbars
      >
        <Stack gap="lg">
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
              gap="xs"
              style={{ 
                flexDirection: message.type === 'user' ? 'row-reverse' : 'row',
                marginBottom: '4px'
              }}
            >
              <Avatar 
                size={28}
                color={message.type === 'user' ? 'dark' : 'gray'}
                style={{ 
                  flexShrink: 0,
                  marginTop: '2px',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                  border: '1px solid var(--border-color)'
                }}
              >
                {message.type === 'user' ? <IconUser size={14} /> : <IconRobot size={14} />}
              </Avatar>
              
              <Box
                style={{
                  position: 'relative',
                  maxWidth: message.type === 'user' ? '75%' : '80%',
                  marginLeft: message.type === 'user' ? '0' : '8px',
                  marginRight: message.type === 'user' ? '8px' : '0'
                }}
              >
                <Box
                  style={{
                    backgroundColor: message.type === 'user' ? 'var(--primary)' : 'var(--secondary)',
                    color: message.type === 'user' ? 'var(--background)' : 'var(--foreground)',
                    borderRadius: message.type === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                    padding: message.image ? '10px' : '10px 14px',
                    wordBreak: 'break-word',
                    border: message.type === 'assistant' ? '1px solid var(--border-color)' : 'none',
                    boxShadow: message.type === 'user' 
                      ? '0 2px 8px rgba(0, 0, 0, 0.15)' 
                      : '0 1px 4px rgba(0, 0, 0, 0.08)',
                    position: 'relative'
                  }}
                >
                  {message.image && (
                    <Box
                      style={{
                        marginBottom: message.text ? '8px' : '0',
                        borderRadius: '12px',
                        overflow: 'hidden',
                        border: '1px solid rgba(0, 0, 0, 0.1)',
                        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                      }}
                    >
                      <Image
                        src={message.image}
                        alt="User uploaded image"
                        maw={220}
                        style={{ display: 'block' }}
                      />
                    </Box>
                  )}
                  {message.text && (
                    <Text size="sm" style={{ lineHeight: 1.4 }}>
                      {message.text}
                    </Text>
                  )}
                </Box>
                <Group 
                  justify={message.type === 'user' ? 'flex-end' : 'flex-start'}
                  gap="xs"
                  style={{ 
                    marginTop: '4px',
                    marginLeft: message.type === 'user' ? '0' : '4px',
                    marginRight: message.type === 'user' ? '4px' : '0'
                  }}
                >
                  <Text 
                    size="xs" 
                    style={{ 
                      opacity: 0.6,
                      color: 'var(--primary-light)'
                    }}
                  >
                    {message.timestamp.toLocaleTimeString([], { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </Text>
                  {message.cost && (
                    <ActionIcon
                      size="xs"
                      variant="subtle"
                      color="gray"
                      onClick={() => openCostModal(message.cost!)}
                      style={{
                        opacity: 0.6,
                        '&:hover': {
                          opacity: 1
                        }
                      }}
                    >
                      <IconInfoCircle size={12} />
                    </ActionIcon>
                  )}
                </Group>
              </Box>
            </Group>
          ))}
          {isLoading && (
            <Group align="flex-start" gap="xs" style={{ marginBottom: '4px' }}>
              <Avatar 
                size={28} 
                color="gray"
                style={{ 
                  flexShrink: 0,
                  marginTop: '2px',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                  border: '1px solid var(--border-color)'
                }}
              >
                <IconRobot size={14} />
              </Avatar>
              <Box style={{ marginLeft: '8px' }}>
                <Box
                  style={{
                    backgroundColor: 'var(--secondary)',
                    borderRadius: '18px 18px 18px 4px',
                    padding: '10px 14px',
                    border: '1px solid var(--border-color)',
                    boxShadow: '0 1px 4px rgba(0, 0, 0, 0.08)',
                    position: 'relative'
                  }}
                >
                  <Group gap="xs" align="center">
                    <Box
                      style={{
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        backgroundColor: 'var(--primary-light)',
                        animation: 'pulse 1.5s ease-in-out infinite'
                      }}
                    />
                    <Box
                      style={{
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        backgroundColor: 'var(--primary-light)',
                        animation: 'pulse 1.5s ease-in-out infinite 0.3s'
                      }}
                    />
                    <Box
                      style={{
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        backgroundColor: 'var(--primary-light)',
                        animation: 'pulse 1.5s ease-in-out infinite 0.6s'
                      }}
                    />
                    <Text size="sm" c="dimmed" ml="xs">Generating...</Text>
                  </Group>
                </Box>
              </Box>
            </Group>
          )}
        </Stack>
      </ScrollArea>

      {/* Cost Modal */}
      <Modal
        opened={costModalOpen}
        onClose={() => setCostModalOpen(false)}
        title="Cost Breakdown"
        size="md"
      >
        {selectedMessageCost && (
          <Stack gap="md">
            <Text size="sm" c="dimmed">
              Detailed cost breakdown for this AI response
            </Text>
            
            <Table>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Item</Table.Th>
                  <Table.Th>Tokens</Table.Th>
                  <Table.Th>Rate</Table.Th>
                  <Table.Th>Cost</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                <Table.Tr>
                  <Table.Td>Input Text</Table.Td>
                  <Table.Td>{selectedMessageCost.inputTokens.toLocaleString()}</Table.Td>
                  <Table.Td>$0.30 / 1M tokens</Table.Td>
                  <Table.Td>${selectedMessageCost.inputCost.toFixed(6)}</Table.Td>
                </Table.Tr>
                <Table.Tr>
                  <Table.Td>Output Text</Table.Td>
                  <Table.Td>{selectedMessageCost.outputTokens.toLocaleString()}</Table.Td>
                  <Table.Td>$2.50 / 1M tokens</Table.Td>
                  <Table.Td>${selectedMessageCost.outputCost.toFixed(6)}</Table.Td>
                </Table.Tr>
                {selectedMessageCost.imageTokens > 0 && (
                  <Table.Tr>
                    <Table.Td>Image Tokens</Table.Td>
                    <Table.Td>{selectedMessageCost.imageTokens.toLocaleString()}</Table.Td>
                    <Table.Td>$0.039 / 1M tokens</Table.Td>
                    <Table.Td>${selectedMessageCost.imageCost.toFixed(6)}</Table.Td>
                  </Table.Tr>
                )}
              </Table.Tbody>
            </Table>
            
            <Divider />
            
            <Group justify="space-between">
              <Text fw={600}>Total Cost:</Text>
              <Text fw={600} size="lg">{selectedMessageCost.formattedCost}</Text>
            </Group>
            
            <Text size="xs" c="dimmed">
              * Costs are calculated based on Gemini 2.5 Flash pricing
              <br />
              * Text: $0.30/1M input, $2.50/1M output • Images: $0.039/1M tokens
            </Text>
          </Stack>
        )}
      </Modal>

      {/* Input Area */}
      <Box p="md" style={{ borderTop: '1px solid var(--border-color)' }}>
        <Stack gap="xs">
          {inputImage && (
            <Box
              p="sm"
              style={{
                backgroundColor: 'var(--secondary)',
                borderRadius: 12,
                border: '1px solid var(--border-color)',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
              }}
            >
              <Group justify="space-between" align="center">
                <Group gap="sm">
                  <Box
                    style={{
                      borderRadius: '8px',
                      overflow: 'hidden',
                      border: '1px solid var(--border-color)',
                      boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)'
                    }}
                  >
                    <Image
                      src={URL.createObjectURL(inputImage)}
                      alt="Selected image"
                      w={36}
                      h={36}
                      style={{ display: 'block' }}
                    />
                  </Box>
                  <Text size="sm" c="dimmed" truncate maw={180}>
                    {inputImage.name}
                  </Text>
                </Group>
                <ActionIcon 
                  size="sm" 
                  variant="subtle" 
                  color="gray" 
                  onClick={removeImage}
                  style={{
                    borderRadius: '6px',
                    '&:hover': {
                      backgroundColor: 'var(--tertiary)'
                    }
                  }}
                >
                  <IconX size={14} />
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
            <Group gap="xs">
              <FileButton
                resetRef={resetRef}
                onChange={handleImageUpload}
                accept="image/*"
              >
                {(props) => (
                  <ActionIcon 
                    {...props} 
                    variant="subtle" 
                    size="lg" 
                    color="gray"
                    style={{
                      borderRadius: '10px',
                      border: '1px solid var(--border-color)',
                      backgroundColor: 'var(--secondary)',
                      boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)'
                    }}
                  >
                    <IconPhoto size={18} />
                  </ActionIcon>
                )}
              </FileButton>
              <ActionIcon
                size="lg"
                color="dark"
                onClick={sendMessage}
                loading={isLoading}
                disabled={!inputText.trim() && !inputImage}
                style={{
                  borderRadius: '10px',
                  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                  border: 'none'
                }}
              >
                <IconSend size={18} />
              </ActionIcon>
            </Group>
          </Group>
        </Stack>
      </Box>
    </Box>
  );
}
