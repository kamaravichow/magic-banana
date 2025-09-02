'use client';

import { ActionIcon, Box, Divider, Group, Loader, Modal, Notification, NumberInput, Slider, Stack, Text, Tooltip } from '@mantine/core';
import {
    IconAdjustments,
    IconDownload,
    IconFlipHorizontal,
    IconFlipVertical,
    IconMaximize,
    IconResize,
    IconRotateClockwise,
    IconRuler,
    IconSparkles,
    IconZoomIn,
    IconZoomOut
} from '@tabler/icons-react';
import React, { useCallback, useRef, useState } from 'react';
import { COOKIE_NAMES, cookieUtils } from '../utils/cookies';

interface AdvancedImageViewerProps {
  src: string;
  alt?: string;
  onClose?: () => void;
  showToolbar?: boolean;
  showRulers?: boolean;
  enableGestures?: boolean;
  className?: string;
  style?: React.CSSProperties;
  onImageEnhanced?: (enhancedImageData: { data: string; mimeType: string }) => void;
}

interface Transform {
  scale: number;
  translateX: number;
  translateY: number;
  rotation: number;
  flipX: boolean;
  flipY: boolean;
}

interface ImageAdjustments {
  brightness: number;
  contrast: number;
  saturation: number;
  hue: number;
}

export default function AdvancedImageViewer({
  src,
  alt = "Image",
  onClose,
  showToolbar = true,
  showRulers = true,
  enableGestures = true,
  className,
  style,
  onImageEnhanced
}: AdvancedImageViewerProps) {
  const [transform, setTransform] = useState<Transform>({
    scale: 1,
    translateX: 0,
    translateY: 0,
    rotation: 0,
    flipX: false,
    flipY: false
  });
  
  const [adjustments, setAdjustments] = useState<ImageAdjustments>({
    brightness: 100,
    contrast: 100,
    saturation: 100,
    hue: 0
  });

  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [lastTouchDistance, setLastTouchDistance] = useState(0);
  const [showAdjustments, setShowAdjustments] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [enhanceError, setEnhanceError] = useState<string | null>(null);
  const [enhanceSuccess, setEnhanceSuccess] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  // Load image and get dimensions
  const handleImageLoad = useCallback(() => {
    if (imageRef.current) {
      setImageDimensions({
        width: imageRef.current.naturalWidth,
        height: imageRef.current.naturalHeight
      });
      setImageLoaded(true);
    }
  }, []);

  // Zoom functions
  const zoomIn = () => setTransform(prev => ({ ...prev, scale: Math.min(prev.scale * 1.5, 10) }));
  const zoomOut = () => setTransform(prev => ({ ...prev, scale: Math.max(prev.scale / 1.5, 0.1) }));
  const fitToScreen = () => {
    if (!containerRef.current || !imageRef.current) return;
    
    const container = containerRef.current.getBoundingClientRect();
    const imageAspect = imageDimensions.width / imageDimensions.height;
    const containerAspect = container.width / container.height;
    
    let scale;
    if (imageAspect > containerAspect) {
      scale = (container.width * 0.9) / imageDimensions.width;
    } else {
      scale = (container.height * 0.9) / imageDimensions.height;
    }
    
    setTransform(prev => ({ 
      ...prev, 
      scale: Math.max(scale, 0.1),
      translateX: 0,
      translateY: 0
    }));
  };

  const actualSize = () => setTransform(prev => ({ ...prev, scale: 1, translateX: 0, translateY: 0 }));

  // Transform functions
  const rotate = () => setTransform(prev => ({ ...prev, rotation: (prev.rotation + 90) % 360 }));
  const flipHorizontal = () => setTransform(prev => ({ ...prev, flipX: !prev.flipX }));
  const flipVertical = () => setTransform(prev => ({ ...prev, flipY: !prev.flipY }));

  // Mouse/Touch event handlers
  const getTouchDistance = (touches: TouchList) => {
    if (touches.length < 2) return 0;
    const touch1 = touches[0];
    const touch2 = touches[1];
    return Math.sqrt(
      Math.pow(touch2.clientX - touch1.clientX, 2) + 
      Math.pow(touch2.clientY - touch1.clientY, 2)
    );
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!enableGestures) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - transform.translateX, y: e.clientY - transform.translateY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !enableGestures) return;
    setTransform(prev => ({
      ...prev,
      translateX: e.clientX - dragStart.x,
      translateY: e.clientY - dragStart.y
    }));
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (!enableGestures) return;
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setTransform(prev => ({ ...prev, scale: Math.max(0.1, Math.min(10, prev.scale * delta)) }));
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!enableGestures) return;
    if (e.touches.length === 2) {
      setLastTouchDistance(getTouchDistance(e.touches as any));
    } else if (e.touches.length === 1) {
      setIsDragging(true);
      const touch = e.touches[0];
      setDragStart({ x: touch.clientX - transform.translateX, y: touch.clientY - transform.translateY });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!enableGestures) return;
    e.preventDefault();
    
    if (e.touches.length === 2) {
      const distance = getTouchDistance(e.touches as any);
      if (lastTouchDistance > 0) {
        const scale = distance / lastTouchDistance;
        setTransform(prev => ({ 
          ...prev, 
          scale: Math.max(0.1, Math.min(10, prev.scale * scale)) 
        }));
      }
      setLastTouchDistance(distance);
    } else if (e.touches.length === 1 && isDragging) {
      const touch = e.touches[0];
      setTransform(prev => ({
        ...prev,
        translateX: touch.clientX - dragStart.x,
        translateY: touch.clientY - dragStart.y
      }));
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    setLastTouchDistance(0);
  };

  // Download function
  const downloadImage = () => {
    const link = document.createElement('a');
    link.href = src;
    link.download = `image-${Date.now()}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Enhance image function
  const enhanceImage = async () => {
    if (!src || isEnhancing) return;

    setIsEnhancing(true);
    setEnhanceError(null);
    setEnhanceSuccess(false);

    try {
      // Convert the image source to a blob and then to a file
      const response = await fetch(src);
      const blob = await response.blob();
      const file = new File([blob], 'image.png', { type: blob.type });

      const formData = new FormData();
      formData.append('image', file);
      
      // Add custom API key if available
      const customApiKey = cookieUtils.get(COOKIE_NAMES.REPLICATE_API_KEY);
      if (customApiKey) {
        formData.append('customApiKey', customApiKey);
      }

      const enhanceResponse = await fetch('/api/enhance-image', {
        method: 'POST',
        body: formData,
      });

      if (!enhanceResponse.ok) {
        const errorData = await enhanceResponse.json();
        throw new Error(errorData.error || 'Failed to enhance image');
      }

      const result = await enhanceResponse.json();

      if (result.success && result.enhancedImage) {
        setEnhanceSuccess(true);
        if (onImageEnhanced) {
          onImageEnhanced(result.enhancedImage);
        }
      } else {
        throw new Error('Enhancement completed but no enhanced image was returned');
      }

    } catch (error) {
      console.error('Error enhancing image:', error);
      setEnhanceError(error instanceof Error ? error.message : 'Failed to enhance image');
    } finally {
      setIsEnhancing(false);
    }
  };

  // Reset all transforms and adjustments
  const resetAll = () => {
    setTransform({
      scale: 1,
      translateX: 0,
      translateY: 0,
      rotation: 0,
      flipX: false,
      flipY: false
    });
    setAdjustments({
      brightness: 100,
      contrast: 100,
      saturation: 100,
      hue: 0
    });
  };

  // Generate CSS filters
  const getFilterStyle = () => {
    return `brightness(${adjustments.brightness}%) contrast(${adjustments.contrast}%) saturate(${adjustments.saturation}%) hue-rotate(${adjustments.hue}deg)`;
  };

  // Ruler component
  const Ruler = ({ orientation, size }: { orientation: 'horizontal' | 'vertical', size: number }) => {
    const marks = [];
    const pixelsPerMark = 50;
    const marksCount = Math.ceil(size / pixelsPerMark);
    
    for (let i = 0; i <= marksCount; i++) {
      const position = i * pixelsPerMark;
      marks.push(
        <Box
          key={i}
          style={{
            position: 'absolute',
            [orientation === 'horizontal' ? 'left' : 'top']: `${position}px`,
            [orientation === 'horizontal' ? 'top' : 'left']: 0,
            width: orientation === 'horizontal' ? '1px' : '100%',
            height: orientation === 'horizontal' ? '100%' : '1px',
            backgroundColor: '#666666',
            opacity: 0.6
          }}
        />
      );
      
      if (i % 2 === 0) {
        marks.push(
          <Text
            key={`label-${i}`}
            size="xs"
            style={{
              position: 'absolute',
              [orientation === 'horizontal' ? 'left' : 'top']: `${position + 2}px`,
              [orientation === 'horizontal' ? 'top' : 'left']: '2px',
              color: '#cccccc',
              fontSize: '10px',
              fontWeight: 500
            }}
          >
            {position}
          </Text>
        );
      }
    }
    
    return (
      <Box
        style={{
          position: 'absolute',
          [orientation === 'horizontal' ? 'top' : 'left']: 0,
          [orientation === 'horizontal' ? 'left' : 'top']: orientation === 'horizontal' ? '20px' : '20px',
          [orientation === 'horizontal' ? 'width' : 'height']: `${size}px`,
          [orientation === 'horizontal' ? 'height' : 'width']: '20px',
          backgroundColor: 'rgba(42, 42, 42, 0.95)',
          borderBottom: orientation === 'horizontal' ? '1px solid #444444' : 'none',
          borderRight: orientation === 'vertical' ? '1px solid #444444' : 'none',
          backdropFilter: 'blur(4px)',
          zIndex: 5
        }}
      >
        {marks}
      </Box>
    );
  };

  return (
    <Box
      className={className}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        backgroundColor: '#1a1a1a',
        ...style
      }}
    >
      {/* Error notification */}
      {enhanceError && (
        <Box style={{ position: 'absolute', top: 16, left: 16, right: 16, zIndex: 1000 }}>
          <Notification
            color="red"
            onClose={() => setEnhanceError(null)}
            title="Enhancement Failed"
          >
            {enhanceError}
          </Notification>
        </Box>
      )}

      {/* Success notification */}
      {enhanceSuccess && (
        <Box style={{ position: 'absolute', top: 16, left: 16, right: 16, zIndex: 1000 }}>
          <Notification
            color="green"
            onClose={() => setEnhanceSuccess(false)}
            title="Enhancement Complete"
          >
            Image has been enhanced and sent to the editor!
          </Notification>
        </Box>
      )}
      {/* Rulers */}
      {showRulers && imageLoaded && (
        <>
          <Ruler orientation="horizontal" size={containerRef.current?.clientWidth || 800} />
          <Ruler orientation="vertical" size={containerRef.current?.clientHeight || 600} />
          <Box
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
                          width: '20px',
            height: '20px',
            backgroundColor: '#333333',
            border: '1px solid #444444',
            zIndex: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
            }}
          >
            <IconRuler size={12} />
          </Box>
        </>
      )}

      {/* Toolbar */}
      {showToolbar && (
        <Box
          style={{
            position: 'absolute',
            top: showRulers ? '30px' : '16px',
            left: showRulers ? '30px' : '16px',
            zIndex: 20,
            backgroundColor: 'rgba(42, 42, 42, 0.95)',
            borderRadius: '12px',
            padding: '8px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)',
            backdropFilter: 'blur(8px)',
            border: '1px solid #444444'
          }}
        >
          <Group gap="xs">
            {/* Zoom Controls */}
            <Tooltip label="Zoom In">
              <ActionIcon variant="subtle" onClick={zoomIn} disabled={transform.scale >= 10}>
                <IconZoomIn size={16} />
              </ActionIcon>
            </Tooltip>
            
            <NumberInput
              value={Math.round(transform.scale * 100)}
              onChange={(value) => setTransform(prev => ({ ...prev, scale: (value || 100) / 100 }))}
              size="xs"
              w={60}
              min={10}
              max={1000}
              suffix="%"
              hideControls
            />
            
            <Tooltip label="Zoom Out">
              <ActionIcon variant="subtle" onClick={zoomOut} disabled={transform.scale <= 0.1}>
                <IconZoomOut size={16} />
              </ActionIcon>
            </Tooltip>
            
            <Tooltip label="Fit to Screen">
              <ActionIcon variant="subtle" onClick={fitToScreen}>
                <IconResize size={16} />
              </ActionIcon>
            </Tooltip>
            
            <Tooltip label="Actual Size">
              <ActionIcon variant="subtle" onClick={actualSize}>
                <IconMaximize size={16} />
              </ActionIcon>
            </Tooltip>

            <Divider orientation="vertical" />

            {/* Transform Controls */}
            <Tooltip label="Rotate 90°">
              <ActionIcon variant="subtle" onClick={rotate}>
                <IconRotateClockwise size={16} />
              </ActionIcon>
            </Tooltip>
            
            <Tooltip label="Flip Horizontal">
              <ActionIcon variant="subtle" onClick={flipHorizontal} color={transform.flipX ? 'blue' : undefined}>
                <IconFlipHorizontal size={16} />
              </ActionIcon>
            </Tooltip>
            
            <Tooltip label="Flip Vertical">
              <ActionIcon variant="subtle" onClick={flipVertical} color={transform.flipY ? 'blue' : undefined}>
                <IconFlipVertical size={16} />
              </ActionIcon>
            </Tooltip>

            <Divider orientation="vertical" />

            {/* Adjustment Controls */}
            <Tooltip label="Adjustments">
              <ActionIcon variant="subtle" onClick={() => setShowAdjustments(true)}>
                <IconAdjustments size={16} />
              </ActionIcon>
            </Tooltip>

            <Divider orientation="vertical" />

            {/* AI Enhancement */}
            <Tooltip label="Enhance with AI">
              <ActionIcon 
                variant="subtle" 
                color="blue" 
                onClick={enhanceImage}
                disabled={isEnhancing}
                loading={isEnhancing}
              >
                {isEnhancing ? <Loader size={16} /> : <IconSparkles size={16} />}
              </ActionIcon>
            </Tooltip>
            
            <Tooltip label="Download">
              <ActionIcon variant="subtle" color="gray" onClick={downloadImage}>
                <IconDownload size={16} />
              </ActionIcon>
            </Tooltip>
          </Group>
        </Box>
      )}

      {/* Image Container */}
      <Box
        ref={containerRef}
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: enableGestures ? (isDragging ? 'grabbing' : 'grab') : 'default',
          paddingTop: showRulers ? '20px' : 0,
          paddingLeft: showRulers ? '20px' : 0
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <img
          ref={imageRef}
          src={src}
          alt={alt}
          onLoad={handleImageLoad}
          style={{
            maxWidth: 'none',
            maxHeight: 'none',
            transform: `
              translate(${transform.translateX}px, ${transform.translateY}px)
              scale(${transform.scale})
              rotate(${transform.rotation}deg)
              scaleX(${transform.flipX ? -1 : 1})
              scaleY(${transform.flipY ? -1 : 1})
            `,
            filter: getFilterStyle(),
            transition: isDragging ? 'none' : 'transform 0.2s ease',
            userSelect: 'none',
            pointerEvents: 'none'
          }}
        />
      </Box>

      {/* Image info overlay */}
      {imageLoaded && (
        <Box
          style={{
            position: 'absolute',
            bottom: '16px',
            right: '16px',
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            color: '#e0e0e0',
            padding: '8px 12px',
            borderRadius: '8px',
            fontSize: '12px',
            fontWeight: 500
          }}
        >
          {imageDimensions.width} × {imageDimensions.height} • {Math.round(transform.scale * 100)}%
        </Box>
      )}

      {/* Adjustments Modal */}
      <Modal
        opened={showAdjustments}
        onClose={() => setShowAdjustments(false)}
        title="Image Adjustments"
        size="md"
      >
        <Stack gap="lg">
          <Box>
            <Text size="sm" fw={500} mb="xs">Brightness</Text>
            <Slider
              value={adjustments.brightness}
              onChange={(value) => setAdjustments(prev => ({ ...prev, brightness: value }))}
              min={0}
              max={200}
              step={1}
              marks={[
                { value: 0, label: '0%' },
                { value: 100, label: '100%' },
                { value: 200, label: '200%' }
              ]}
            />
          </Box>
          
          <Box>
            <Text size="sm" fw={500} mb="xs">Contrast</Text>
            <Slider
              value={adjustments.contrast}
              onChange={(value) => setAdjustments(prev => ({ ...prev, contrast: value }))}
              min={0}
              max={200}
              step={1}
              marks={[
                { value: 0, label: '0%' },
                { value: 100, label: '100%' },
                { value: 200, label: '200%' }
              ]}
            />
          </Box>
          
          <Box>
            <Text size="sm" fw={500} mb="xs">Saturation</Text>
            <Slider
              value={adjustments.saturation}
              onChange={(value) => setAdjustments(prev => ({ ...prev, saturation: value }))}
              min={0}
              max={200}
              step={1}
              marks={[
                { value: 0, label: '0%' },
                { value: 100, label: '100%' },
                { value: 200, label: '200%' }
              ]}
            />
          </Box>
          
          <Box>
            <Text size="sm" fw={500} mb="xs">Hue</Text>
            <Slider
              value={adjustments.hue}
              onChange={(value) => setAdjustments(prev => ({ ...prev, hue: value }))}
              min={-180}
              max={180}
              step={1}
              marks={[
                { value: -180, label: '-180°' },
                { value: 0, label: '0°' },
                { value: 180, label: '180°' }
              ]}
            />
          </Box>
          
          <Group>
            <ActionIcon variant="light" onClick={resetAll}>
              Reset All
            </ActionIcon>
          </Group>
        </Stack>
      </Modal>
    </Box>
  );
}
