'use client';

import { DndContext, useDraggable, useDroppable, DragEndEvent } from '@dnd-kit/core';
import { useState } from 'react';

function DraggableItem() {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: 'test-draggable',
  });
  
  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined;
  
  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className="p-4 bg-blue-500 text-white rounded cursor-grab"
    >
      Drag me!
    </div>
  );
}

function DroppableArea() {
  const { isOver, setNodeRef } = useDroppable({
    id: 'test-droppable',
  });
  
  return (
    <div
      ref={setNodeRef}
      className={`p-8 border-2 border-dashed rounded ${
        isOver ? 'border-green-500 bg-green-50' : 'border-gray-300'
      }`}
    >
      Drop here
    </div>
  );
}

export default function DndTest() {
  const [isDropped, setIsDropped] = useState(false);
  
  function handleDragEnd(event: DragEndEvent) {
    if (event.over && event.over.id === 'test-droppable') {
      setIsDropped(true);
    }
  }
  
  return (
    <DndContext onDragEnd={handleDragEnd}>
      <div className="p-8 space-y-8">
        <h2 className="text-xl font-bold">Drag and Drop Test</h2>
        <DraggableItem />
        <DroppableArea />
        {isDropped && (
          <p className="text-green-600 font-bold">Successfully dropped!</p>
        )}
      </div>
    </DndContext>
  );
}
