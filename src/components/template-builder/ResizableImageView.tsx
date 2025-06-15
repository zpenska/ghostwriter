// Create this file: src/components/template-builder/ResizableImageView.tsx

import React, { useState, useRef, useCallback } from 'react';
import { NodeViewWrapper } from '@tiptap/react';

interface ResizableImageViewProps {
  node: {
    attrs: {
      src: string;
      alt?: string;
      title?: string;
      width?: number;
      height?: number;
    };
  };
  updateAttributes: (attrs: any) => void;
  selected: boolean;
}

export const ResizableImageView: React.FC<ResizableImageViewProps> = ({
  node,
  updateAttributes,
  selected,
}) => {
  const [isResizing, setIsResizing] = useState(false);
  const [resizeDirection, setResizeDirection] = useState<string>('');
  const imgRef = useRef<HTMLImageElement>(null);
  const startPos = useRef({ x: 0, y: 0 });
  const startSize = useRef({ width: 0, height: 0 });

  const handleMouseDown = useCallback((e: React.MouseEvent, direction: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    setIsResizing(true);
    setResizeDirection(direction);
    
    const rect = imgRef.current?.getBoundingClientRect();
    if (rect) {
      startPos.current = { x: e.clientX, y: e.clientY };
      startSize.current = { 
        width: rect.width, 
        height: rect.height 
      };
    }

    const handleMouseMove = (e: MouseEvent) => {
      if (!imgRef.current) return;

      const deltaX = e.clientX - startPos.current.x;
      const deltaY = e.clientY - startPos.current.y;
      
      let newWidth = startSize.current.width;
      let newHeight = startSize.current.height;

      // Calculate new dimensions based on resize direction
      switch (direction) {
        case 'se': // Southeast corner
          newWidth = Math.max(50, startSize.current.width + deltaX);
          newHeight = Math.max(50, startSize.current.height + deltaY);
          break;
        case 'sw': // Southwest corner
          newWidth = Math.max(50, startSize.current.width - deltaX);
          newHeight = Math.max(50, startSize.current.height + deltaY);
          break;
        case 'ne': // Northeast corner
          newWidth = Math.max(50, startSize.current.width + deltaX);
          newHeight = Math.max(50, startSize.current.height - deltaY);
          break;
        case 'nw': // Northwest corner
          newWidth = Math.max(50, startSize.current.width - deltaX);
          newHeight = Math.max(50, startSize.current.height - deltaY);
          break;
        case 'e': // East side
          newWidth = Math.max(50, startSize.current.width + deltaX);
          break;
        case 'w': // West side
          newWidth = Math.max(50, startSize.current.width - deltaX);
          break;
        case 's': // South side
          newHeight = Math.max(50, startSize.current.height + deltaY);
          break;
        case 'n': // North side
          newHeight = Math.max(50, startSize.current.height - deltaY);
          break;
      }

      // Update the image dimensions
      updateAttributes({
        width: Math.round(newWidth),
        height: Math.round(newHeight),
      });
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      setResizeDirection('');
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [updateAttributes]);

  const handleDoubleClick = useCallback(() => {
    // Reset to original size on double-click
    updateAttributes({
      width: null,
      height: null,
    });
  }, [updateAttributes]);

  const { src, alt, title, width, height } = node.attrs;

  return (
    <NodeViewWrapper className="resizable-image-wrapper">
      <div 
        className={`
          relative inline-block max-w-full
          ${selected ? 'ring-2 ring-blue-500 ring-opacity-50' : ''}
          ${isResizing ? 'select-none' : ''}
        `}
        style={{ 
          width: width ? `${width}px` : 'auto',
          height: height ? `${height}px` : 'auto'
        }}
      >
        <img
          ref={imgRef}
          src={src}
          alt={alt || ''}
          title={title || ''}
          className="block max-w-full h-auto rounded shadow-sm"
          style={{
            width: width ? `${width}px` : 'auto',
            height: height ? `${height}px` : 'auto',
            objectFit: 'contain'
          }}
          onDoubleClick={handleDoubleClick}
          draggable={false}
        />
        
        {/* Resize handles - only show when selected */}
        {selected && !isResizing && (
          <>
            {/* Corner handles */}
            <div
              className="absolute -top-1 -left-1 w-3 h-3 bg-blue-500 border-2 border-white rounded-full cursor-nw-resize shadow-sm"
              onMouseDown={(e) => handleMouseDown(e, 'nw')}
            />
            <div
              className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 border-2 border-white rounded-full cursor-ne-resize shadow-sm"
              onMouseDown={(e) => handleMouseDown(e, 'ne')}
            />
            <div
              className="absolute -bottom-1 -left-1 w-3 h-3 bg-blue-500 border-2 border-white rounded-full cursor-sw-resize shadow-sm"
              onMouseDown={(e) => handleMouseDown(e, 'sw')}
            />
            <div
              className="absolute -bottom-1 -right-1 w-3 h-3 bg-blue-500 border-2 border-white rounded-full cursor-se-resize shadow-sm"
              onMouseDown={(e) => handleMouseDown(e, 'se')}
            />
            
            {/* Side handles */}
            <div
              className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-3 h-3 bg-blue-500 border-2 border-white rounded-full cursor-n-resize shadow-sm"
              onMouseDown={(e) => handleMouseDown(e, 'n')}
            />
            <div
              className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-3 h-3 bg-blue-500 border-2 border-white rounded-full cursor-s-resize shadow-sm"
              onMouseDown={(e) => handleMouseDown(e, 's')}
            />
            <div
              className="absolute -left-1 top-1/2 transform -translate-y-1/2 w-3 h-3 bg-blue-500 border-2 border-white rounded-full cursor-w-resize shadow-sm"
              onMouseDown={(e) => handleMouseDown(e, 'w')}
            />
            <div
              className="absolute -right-1 top-1/2 transform -translate-y-1/2 w-3 h-3 bg-blue-500 border-2 border-white rounded-full cursor-e-resize shadow-sm"
              onMouseDown={(e) => handleMouseDown(e, 'e')}
            />
          </>
        )}
        
        {/* Size indicator when resizing */}
        {isResizing && (
          <div className="absolute -top-8 left-0 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
            {width} × {height}
          </div>
        )}
      </div>
    </NodeViewWrapper>
  );
};