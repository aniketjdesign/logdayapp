import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface SortableItemProps {
  id: string;
  children: React.ReactNode;
}

export const SortableItem: React.FC<SortableItemProps> = ({ id, children }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id,
    attributes: {
      role: 'button',
      'aria-label': 'drag handle'
    }
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    touchAction: 'manipulation',
    
  };

  return (
<div ref={setNodeRef} style={style}>
      {React.cloneElement(children as React.ReactElement, {
        ...attributes,
        ...listeners,
        className: `${(children as React.ReactElement).props.className || ''} ${
          isDragging ? 'bg-blue-50 border-blue-400' : 'border-gray-200'
        }`,
      })}
    </div>
  );
};