import React, { useState, useRef, useEffect } from 'react';
import { MuscleGroup } from '../types/workout';
import { CustomExercise, NewCustomExercise } from '../types/exercise';
import { exerciseService } from '../services/exerciseService';
import { ChevronDown } from 'lucide-react';

interface AddExerciseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExerciseAdded: (exercise: CustomExercise) => void;
}

export const AddExerciseModal: React.FC<AddExerciseModalProps> = ({
  isOpen,
  onClose,
  onExerciseAdded
}) => {
  const [form, setForm] = useState<NewCustomExercise>({
    name: '',
    muscle_group: 'Chest',
    instruction: '',
    category: ''
  });
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen) {
      const mainContainer = document.querySelector('.app-wrapper');
      if (mainContainer) {
        mainContainer.classList.add('overflow-hidden');
        mainContainer.classList.remove('overflow-y-scroll');
      }
    } else {
      const mainContainer = document.querySelector('.app-wrapper');
      if (mainContainer) {
        mainContainer.classList.remove('overflow-hidden');
        mainContainer.classList.add('overflow-y-scroll');
      }
    }

    return () => {
      const mainContainer = document.querySelector('.app-wrapper');
      if (mainContainer) {
        mainContainer.classList.remove('overflow-hidden');
        mainContainer.classList.add('overflow-y-scroll');
      }
    };
  }, [isOpen]);

  const muscleGroups: MuscleGroup[] = [
    'Chest',
    'Back',
    'Shoulders',
    'Quads',
    'Hamstrings',
    'Triceps',
    'Biceps',
    'Forearms',
    'Glutes',
    'Calves',
    'Core',
    'Olympic'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const newExercise = await exerciseService.createExercise(form);
      onExerciseAdded(newExercise);
      onClose();
    } catch (error) {
      console.error('Failed to create exercise:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 p-3 flex items-center justify-center z-50 ">
      <div className="bg-white rounded-xl w-full max-w-md">
        <div className="flex flex-row space-x-4 items-center mb-4 p-4 border-b border-gray-100">
        <h2 className="text-lg font-semibold">Add Custom Exercise</h2>
        <span className="px-1.5 py-0.5 h-content text-xs font-medium bg-blue-50 text-blue-700 rounded">Beta</span></div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="px-4 mb-8 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              type="text"
              value={form.name}
              onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              required
            />
          </div>
          <div ref={dropdownRef} className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">Muscle Group</label>
            <button
              type="button"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-left flex items-center justify-between focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            >
              <span>{form.muscle_group}</span>
              <ChevronDown 
                size={20} 
                className={`text-gray-500 transition-transform duration-200 ${isDropdownOpen ? 'transform rotate-180' : ''}`} 
              />
            </button>
            {isDropdownOpen && (
              <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg">
                <div className="max-h-48 overflow-y-auto py-1">
                  {muscleGroups.map(group => (
                    <button
                      key={group}
                      type="button"
                      className={`w-full px-3 py-2 text-left hover:bg-gray-100 transition-colors ${
                        form.muscle_group === group ? 'bg-blue-50 text-blue-700' : 'text-gray-900'
                      }`}
                      onClick={() => {
                        setForm(prev => ({ ...prev, muscle_group: group }));
                        setIsDropdownOpen(false);
                      }}
                    >
                      {group}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          </div>
          <div className="flex justify-end gap-2 pt-4 px-4 pb-2 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              Add Exercise
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};