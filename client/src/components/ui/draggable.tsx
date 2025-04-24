import React, { ReactNode, useState, useRef, useEffect, forwardRef } from 'react';
import { cn } from '@/lib/utils';

export interface DraggableProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onDragEnd'> {
  children: ReactNode;
  onDragEnd?: (x: number, y: number) => void;
  initialPosition?: { x: number, y: number };
  bounds?: 'parent' | { left: number, top: number, right: number, bottom: number } | null;
  handle?: string;
  disabled?: boolean;
}

export const Draggable = forwardRef<HTMLDivElement, DraggableProps>(({
  children,
  className,
  onDragEnd,
  initialPosition = { x: 0, y: 0 },
  bounds = null,
  handle = '',
  disabled = false,
  ...props
}, ref) => {
  const [position, setPosition] = useState(initialPosition);
  const [isDragging, setIsDragging] = useState(false);
  const elementRef = useRef<HTMLDivElement | null>(null);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const initialPosRef = useRef({ x: 0, y: 0 });
  
  // Function to check if clicked element is handle or descendant of handle
  const isValidHandleClick = (target: HTMLElement) => {
    if (!handle) return true;
    return target.closest(handle) !== null;
  };
  
  // Start dragging
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (disabled || (handle && !isValidHandleClick(e.target as HTMLElement))) return;
    
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    initialPosRef.current = { ...position };
    
    e.preventDefault();
  };
  
  // Update position while dragging
  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;
    
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    
    let newX = initialPosRef.current.x + dx;
    let newY = initialPosRef.current.y + dy;
    
    // Apply bounds if specified
    if (bounds) {
      const element = elementRef.current;
      
      if (element) {
        if (bounds === 'parent') {
          const parent = element.parentElement;
          
          if (parent) {
            const parentRect = parent.getBoundingClientRect();
            const elementRect = element.getBoundingClientRect();
            
            // Calculate bounds relative to parent
            const maxX = parentRect.width - elementRect.width;
            const maxY = parentRect.height - elementRect.height;
            
            newX = Math.max(0, Math.min(newX, maxX));
            newY = Math.max(0, Math.min(newY, maxY));
          }
        } else if (typeof bounds === 'object') {
          // Use custom bounds
          newX = Math.max(bounds.left, Math.min(newX, bounds.right));
          newY = Math.max(bounds.top, Math.min(newY, bounds.bottom));
        }
      }
    }
    
    setPosition({ x: newX, y: newY });
  };
  
  // End dragging
  const handleMouseUp = () => {
    if (isDragging) {
      setIsDragging(false);
      if (onDragEnd) onDragEnd(position.x, position.y);
    }
  };
  
  // Add and remove event listeners
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);
  
  // Set up the ref forwarding
  const setRefs = React.useCallback(
    (node: HTMLDivElement | null) => {
      // Set the local ref
      elementRef.current = node;
      
      // Forward to the passed ref
      if (ref) {
        if (typeof ref === 'function') {
          ref(node);
        } else {
          ref.current = node;
        }
      }
    },
    [ref]
  );

  return (
    <div
      ref={setRefs}
      className={cn(
        'absolute',
        isDragging && 'cursor-grabbing',
        !disabled && !isDragging && 'cursor-grab',
        className
      )}
      style={{
        transform: `translate(${position.x}px, ${position.y}px)`,
        touchAction: 'none',
        transition: isDragging ? 'none' : 'transform 0.1s',
      }}
      onMouseDown={handleMouseDown}
      {...props}
    >
      {children}
    </div>
  );
});

Draggable.displayName = 'Draggable';