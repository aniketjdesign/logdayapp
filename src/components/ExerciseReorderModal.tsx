import React from 'react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { SortableItem } from './SortableItem';
import { Exercise } from '../types/workout';
import { GripVertical } from 'lucide-react';

interface ExerciseReorderModalProps {
  exercises: { exercise: Exercise }[];
  onClose: () => void;
  onReorder: (exercises: { exercise: Exercise }[]) => void;
}

export const ExerciseReorderModal: React.FC<ExerciseReorderModalProps> = ({
  exercises,
  onClose,
  onReorder,
}) => {
  const [items, setItems] = React.useState(exercises);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: any) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      setItems((items) => {
        const oldIndex = items.findIndex(item => item.exercise.id === active.id);
        const newIndex = items.findIndex(item => item.exercise.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleSave = () => {
    onReorder(items);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50">
      <div className="fixed bottom-0 left-0 right-0 h-[85vh] bg-white rounded-t-xl flex flex-col animate-slide-up">
        <div className="flex items-center justify-between p-4 border-b bg-white">
          <h2 className="text-lg font-bold select-none">Reorder Exercises</h2>
          <button
            onClick={handleSave}
            className="px-4 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium"
          >
            Done
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={items.map(item => item.exercise.id)}
              strategy={verticalListSortingStrategy}
            >
              <div>
                {items.map(({ exercise }) => (
                  <SortableItem key={exercise.id} id={exercise.id}>
                    {(listeners) => (
                      <div className="flex items-center px-4 py-3 bg-white border-b">
                        <div 
                          {...listeners}
                          className="p-2 -m-2 cursor-grab active:cursor-grabbing"
                        >
                          <GripVertical className="h-5 w-5 text-gray-400 mr-3 flex-shrink-0" />
                        </div>
                        <span className="text-gray-900">{exercise.name}</span>
                      </div>
                    )}
                  </SortableItem>
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </div>
      </div>
    </div>
  );
};