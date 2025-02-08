import React, { useState } from 'react';
import { X, History } from 'lucide-react';
import { useWorkout } from '../context/WorkoutContext';

interface AddNoteModalProps {
  exerciseName: string;
  exerciseId: string;
  setNumber: number;
  currentNote: string;
  onSave: (note: string) => void;
  onClose: () => void;
}

export const AddNoteModal: React.FC<AddNoteModalProps> = ({
  exerciseName,
  exerciseId,
  setNumber,
  currentNote,
  onSave,
  onClose,
}) => {
  const [note, setNote] = useState(currentNote);
  const { workoutLogs } = useWorkout();

  // Get the most recent note for this exercise and set number
  const lastNote = workoutLogs
    .flatMap(log => 
      log.exercises
        .filter(ex => ex.exercise.id === exerciseId)
        .flatMap(ex => 
          ex.sets
            .filter((set, index) => index + 1 === setNumber && set.comments)
            .map(set => ({
              note: set.comments,
              date: new Date(log.startTime)
            }))
        )
    )
    .sort((a, b) => b.date.getTime() - a.date.getTime())[0]; // Get only the first (most recent) note

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end z-50">
      <div className="bg-white w-full rounded-t-xl p-4 animate-slide-up">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="font-semibold">{exerciseName}</h3>
            <p className="text-sm text-gray-500">Set {setNumber}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full"
          >
            <X size={20} />
          </button>
        </div>

        {/* Previous Note Section */}
        {lastNote && (
          <div className="mb-4">
            <div className="flex items-center gap-1 mb-2">
              <History size={12} className="text-gray-500" />
              <h4 className="text-xs font-medium text-gray-700">Last Note</h4>
            </div>
            <div 
              className="bg-yellow-50 border border-yellow-200 p-2 rounded-lg cursor-pointer hover:bg-gray-100"
              onClick={() => setNote(lastNote.note)}
            >
              <p className="text-sm text-gray-800">{lastNote.note}</p>
              <p className="text-xs text-gray-500 mt-1">
                {lastNote.date.toLocaleDateString()}
              </p>
            </div>
          </div>
        )}

        <textarea
          placeholder="Add a note..."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm min-h-[100px]"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          autoFocus
        />
        <div className="flex space-x-3 mt-4">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(note)}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium"
          >
            Save Note
          </button>
        </div>
      </div>
    </div>
  );
};