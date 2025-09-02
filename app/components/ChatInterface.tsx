'use client';

import { ActionIcon, Badge, Box, Divider, FileButton, Group, Image, Modal, ScrollArea, Stack, Table, Text, Textarea } from '@mantine/core';
import { IconInfoCircle, IconPhoto, IconSend, IconSparkles, IconX } from '@tabler/icons-react';
import { useRef, useState } from 'react';
import { COOKIE_NAMES, cookieUtils } from '../utils/cookies';
import ImagePreviewModal from './ImagePreviewModal';

interface CostInfo {
  inputTokens: number;
  outputTokens: number;
  inputImageTokens: number;
  generatedImages: number;
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
  images?: string[];
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
  const [inputImages, setInputImages] = useState<File[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [costModalOpen, setCostModalOpen] = useState(false);
  const [selectedMessageCost, setSelectedMessageCost] = useState<CostInfo | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [imagePreviewOpen, setImagePreviewOpen] = useState(false);
  const [previewImageSrc, setPreviewImageSrc] = useState<string | null>(null);
  const [previewImageAlt, setPreviewImageAlt] = useState('');
  const resetRef = useRef<() => void>(null);

  const handleImageUpload = (file: File | null) => {
    setInputImage(file);
  };

  const handleMultipleImageUpload = (files: File[]) => {
    setInputImages(prev => [...prev, ...files]);
  };

  const removeImage = () => {
    setInputImage(null);
    resetRef.current?.();
  };

  const removeImageFromList = (index: number) => {
    setInputImages(prev => prev.filter((_, i) => i !== index));
  };

  const clearAllImages = () => {
    setInputImages([]);
  };

  const sendMessage = async () => {
    if (!inputText.trim() && inputImages.length === 0) return;

    const imagesToSend = inputImages;
    
    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      text: inputText,
      images: imagesToSend.length > 0 ? imagesToSend.map(img => URL.createObjectURL(img)) : undefined,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append('prompt', inputText);
      
      // Handle multiple images or single image
      imagesToSend.forEach((image, index) => {
        formData.append(`image_${index}`, image);
      });
      formData.append('imageCount', imagesToSend.length.toString());
      
      // Add custom API key if available
      const customApiKey = cookieUtils.get(COOKIE_NAMES.GEMINI_API_KEY);
      if (customApiKey) {
        formData.append('customApiKey', customApiKey);
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
      setInputImages([]);
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

  const openImagePreview = (src: string, alt: string = 'Image') => {
    setPreviewImageSrc(src);
    setPreviewImageAlt(alt);
    setImagePreviewOpen(true);
  };

  const closeImagePreview = () => {
    setImagePreviewOpen(false);
    setPreviewImageSrc(null);
    setPreviewImageAlt('');
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Only set isDragOver to false if we're leaving the chat area completely
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragOver(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    
    if (imageFiles.length > 0) {
      // Always add to the multiple images array for consistency
      handleMultipleImageUpload(imageFiles);
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
        style={{ 
          flex: 1,
          position: 'relative',
          transition: 'all 0.2s ease'
        }} 
        p="lg" 
        scrollbars="y"
        offsetScrollbars
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {/* Drag overlay */}
        {isDragOver && (
          <Box
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(59, 130, 246, 0.1)',
              border: '2px dashed var(--primary)',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
              margin: '16px',
              pointerEvents: 'none'
            }}
          >
            <Stack align="center" gap="md">
              <Box
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: '50%',
                  backgroundColor: 'var(--primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: 0.9
                }}
              >
                <IconPhoto size={28} color="white" />
              </Box>
              <Text size="lg" fw={600} c="var(--primary)">
                Drop images here
              </Text>
              <Text size="sm" c="dimmed" ta="center">
                Release to add multiple images as context
              </Text>
            </Stack>
          </Box>
        )}

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
                    Upload or drag an image here and describe what you'd like me to do with it
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
              <Box
                style={{
                  position: 'relative',
                  maxWidth: message.type === 'user' ? '85%' : '90%',
                  marginLeft: message.type === 'user' ? 'auto' : '0',
                  marginRight: message.type === 'user' ? '0' : 'auto'
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
                  {(message.image || message.images) && (
                    <Box
                      style={{
                        marginBottom: message.text ? '8px' : '0',
                      }}
                    >
                      {message.images && message.images.length > 0 ? (
                        message.images.length > 1 ? (
                          // Multiple images in horizontal grid
                          <Group gap="xs" wrap="nowrap" style={{ overflowX: 'auto', paddingBottom: '4px' }}>
                            {message.images.map((imgSrc, index) => (
                              <Box
                                key={index}
                                style={{
                                  borderRadius: '12px',
                                  overflow: 'hidden',
                                  border: '1px solid rgba(0, 0, 0, 0.1)',
                                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                                  flexShrink: 0,
                                  cursor: 'pointer',
                                  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                                  '&:hover': {
                                    transform: 'scale(1.02)',
                                    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.15)'
                                  }
                                }}
                                onClick={() => openImagePreview(imgSrc, `User uploaded image ${index + 1}`)}
                              >
                                <Image
                                  src={imgSrc}
                                  alt={`User uploaded image ${index + 1}`}
                                  w={120}
                                  h={120}
                                  fit="cover"
                                  style={{ display: 'block' }}
                                />
                              </Box>
                            ))}
                          </Group>
                        ) : (
                          // Single image from images array
                          <Box
                            style={{
                              borderRadius: '12px',
                              overflow: 'hidden',
                              border: '1px solid rgba(0, 0, 0, 0.1)',
                              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                              cursor: 'pointer',
                              transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                              '&:hover': {
                                transform: 'scale(1.02)',
                                boxShadow: '0 4px 8px rgba(0, 0, 0, 0.15)'
                              }
                            }}
                            onClick={() => openImagePreview(message.images![0], 'User uploaded image')}
                          >
                            <Image
                              src={message.images[0]}
                              alt="User uploaded image"
                              maw={220}
                              style={{ display: 'block' }}
                            />
                          </Box>
                        )
                      ) : message.image && (
                        // Legacy single image support
                        <Box
                          style={{
                            borderRadius: '12px',
                            overflow: 'hidden',
                            border: '1px solid rgba(0, 0, 0, 0.1)',
                            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                            cursor: 'pointer',
                            transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                            '&:hover': {
                              transform: 'scale(1.02)',
                              boxShadow: '0 4px 8px rgba(0, 0, 0, 0.15)'
                            }
                          }}
                          onClick={() => openImagePreview(message.image!, 'User uploaded image')}
                        >
                          <Image
                            src={message.image}
                            alt="User uploaded image"
                            maw={220}
                            style={{ display: 'block' }}
                          />
                        </Box>
                      )}
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
                    marginTop: '4px'
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
              <Box style={{ maxWidth: '90%' }}>
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
                {selectedMessageCost.generatedImages > 0 && (
                  <Table.Tr>
                    <Table.Td>Generated Images</Table.Td>
                    <Table.Td>{selectedMessageCost.generatedImages}</Table.Td>
                    <Table.Td>$0.04 / image</Table.Td>
                    <Table.Td>${selectedMessageCost.imageCost.toFixed(4)}</Table.Td>
                  </Table.Tr>
                )}
                {selectedMessageCost.inputImageTokens > 0 && (
                  <Table.Tr>
                    <Table.Td>Input Images</Table.Td>
                    <Table.Td>{selectedMessageCost.inputImageTokens.toLocaleString()} tokens</Table.Td>
                    <Table.Td>Free</Table.Td>
                    <Table.Td>$0.00</Table.Td>
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
              * Text: $0.30/1M input, $2.50/1M output • Generated Images: $0.04/image
            </Text>
          </Stack>
        )}
      </Modal>

      {/* Image Preview Modal */}
      <ImagePreviewModal
        src={previewImageSrc}
        alt={previewImageAlt}
        opened={imagePreviewOpen}
        onClose={closeImagePreview}
        onImageEnhanced={onImageGenerated}
      />

      {/* Input Area */}
      <Box p="md" style={{ borderTop: '1px solid var(--border-color)' }}>
        <Stack gap="xs">
          {/* Multiple Images Grid */}
          {inputImages.length > 0 && (
            <Box
              p="sm"
              style={{
                backgroundColor: 'var(--secondary)',
                borderRadius: 12,
                border: '1px solid var(--border-color)',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
              }}
            >
              <Group justify="space-between" align="flex-start" mb="xs">
                <Text size="sm" fw={500}>
                  {inputImages.length} image{inputImages.length !== 1 ? 's' : ''} selected
                </Text>
                <ActionIcon 
                  size="sm" 
                  variant="subtle" 
                  color="gray" 
                  onClick={clearAllImages}
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
              
              <Group gap="xs" wrap="nowrap" style={{ overflowX: 'auto', paddingBottom: '4px' }}>
                {inputImages.map((img, index) => (
                  <Box
                    key={index}
                    style={{
                      position: 'relative',
                      borderRadius: '8px',
                      overflow: 'hidden',
                      border: '1px solid var(--border-color)',
                      boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
                      flexShrink: 0
                    }}
                  >
                    <Image
                      src={URL.createObjectURL(img)}
                      alt={`Selected image ${index + 1}`}
                      w={60}
                      h={60}
                      fit="cover"
                      style={{ 
                        display: 'block',
                        cursor: 'pointer'
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        openImagePreview(URL.createObjectURL(img), `Selected image ${index + 1}`);
                      }}
                    />
                    <ActionIcon
                      size="xs"
                      variant="filled"
                      color="dark"
                      onClick={() => removeImageFromList(index)}
                      style={{
                        position: 'absolute',
                        top: '4px',
                        right: '4px',
                        borderRadius: '50%',
                        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.3)'
                      }}
                    >
                      <IconX size={10} />
                    </ActionIcon>
                  </Box>
                ))}
              </Group>
            </Box>
          )}
          
          <Group align="flex-end" gap="xs">
            <Textarea
              placeholder="Say it, we edit."
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
                onChange={(files) => {
                  if (files) {
                    if (Array.isArray(files)) {
                      handleMultipleImageUpload(files);
                    } else {
                      // Convert single file to array for consistency
                      handleMultipleImageUpload([files]);
                    }
                  }
                }}
                accept="image/*"
                multiple
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
                disabled={!inputText.trim() && inputImages.length === 0}
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
