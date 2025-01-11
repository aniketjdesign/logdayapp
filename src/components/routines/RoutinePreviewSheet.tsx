import React from 'react';
import { X } from 'lucide-react';
import { RemoveScroll } from 'react-remove-scroll';

interface RoutinePreviewSheetProps {
  routine: any;
  isOpen: boolean;
  onClose: () => void;
}

export const RoutinePreviewSheet: React.FC<RoutinePreviewSheetProps> = ({
  routine,
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <RemoveScroll>
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50">
        <div 
          className="fixed inset-x-0 bottom-0 transform transition-transform duration-300 ease-in-out"
          style={{ height: '90vh' }}
        >
          <div className="bg-white h-full rounded-t-xl overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <div>
                <h2 className="text-lg font-semibold">{routine.name}</h2>
                {routine.description && (
                  <p className="text-sm text-gray-600 mt-1">{routine.description}</p>
                )}
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X size={20} className="text-gray-500" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4">
              <div className="space-y-6">
                {routine.exercises.map((config: any, index: number) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-medium">{config.exercise.name}</h3>
                        <div className="flex gap-2 mt-1">
                          <span className="text-xs py-1 px-2 bg-gray-100 rounded-lg text-gray-600">
                            {config.exercise.muscleGroup}
                          </span>
                          <span className="text-xs py-1 px-2 bg-gray-100 rounded-lg text-gray-600">
                            {config.sets.length} {config.sets.length === 1 ? 'set' : 'sets'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Sets */}
                    <div className="space-y-2">
                      {config.sets.map((set: any, setIndex: number) => (
                        <div 
                          key={setIndex}
                          className="flex items-center gap-4 text-sm py-2 px-3 bg-gray-50 rounded-lg"
                        >
                          <span className="text-gray-500">Set {setIndex + 1}</span>
                          {set.reps && (
                            <span>{set.reps} reps</span>
                          )}
                          {set.weight && (
                            <span>{set.weight} kg</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </RemoveScroll>
  );
};
