import React, { useState } from 'react';
import { MuscleGroup } from '../types/workout';
import { CustomExercise, NewCustomExercise } from '../types/exercise';
import { exerciseService } from '../services/exerciseService';

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
    'Cardio',
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-lg font-semibold mb-4">Add Custom Exercise</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Name</label>
            <input
              type="text"
              value={form.name}
              onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Muscle Group</label>
            <select
              value={form.muscle_group}
              onChange={e => setForm(prev => ({ ...prev, muscle_group: e.target.value as MuscleGroup }))}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
            >
              {muscleGroups.map(group => (
                <option key={group} value={group}>{group}</option>
              ))}
            </select>
          </div>
          {/* <div>
            <label className="block text-sm font-medium text-gray-700">Instructions</label>
            <textarea
              value={form.instruction || ''}
              onChange={e => setForm(prev => ({ ...prev, instruction: e.target.value }))}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
              rows={3}
            />
          </div> */}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Add Exercise
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};