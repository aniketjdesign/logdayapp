import React, { useState, useEffect } from 'react';
import { X, History, Pin } from 'lucide-react';
import { useWorkout } from '../context/WorkoutContext';

interface AddNoteModalProps {
  exerciseName: string;
  exerciseId: string;
  setNumber: number;
  currentNote: string;
  onSave: (note: string | null) => void;
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
  // Start with the current note value
  const [note, setNote] = useState(currentNote);
  // Track if the current note is pinned - initially true if there's a current note
  const [isPinned, setIsPinned] = useState(!!currentNote);
  // Track if the last note is pinned - initially true if there's a last note
  const [isLastNotePinned, setIsLastNotePinned] = useState(false);
  
  // Update local state when currentNote changes
  useEffect(() => {
    setNote(currentNote);
    setIsPinned(!!currentNote);
  }, [currentNote]);
  const { workoutLogs } = useWorkout();

  // Get the most recent note for this exercise and set number
  const lastNote = workoutLogs
    .flatMap(log => 
      log.exercises
        .filter(ex => ex.exercise.id === exerciseId)
        .flatMap(ex => 
          ex.sets
            .filter((set, index) => index + 1 === setNumber && set.comments && set.comments.trim().length > 0)
            .map(set => ({
              note: set.comments,
              date: new Date(log.startTime)
            }))
        )
    )
    .sort((a, b) => b.date.getTime() - a.date.getTime())[0];
    
  // Set the last note as pinned by default when it's available
  useEffect(() => {
    if (lastNote) {
      setIsLastNotePinned(true);
      // If there's no current note, set the note text to the last note
      // but don't save it automatically to prevent closing the modal
      if (!currentNote) {
        setNote(lastNote.note);
      }
    }
  }, [lastNote, currentNote]);

  // Handle unpinning the Last Note
  const handleUnpinNote = () => {
    // Clear the note completely
    setNote('');
    setIsPinned(false);
    setIsLastNotePinned(false);
    
    // Save a special value to indicate explicitly unpinned
    // Using null instead of empty string to distinguish from a new set with no comments yet
    onSave(null);
    // Close the modal to ensure UI updates
    onClose();
  };

  // Pin the last note without changing the input field
  const handlePinLastNote = () => {
    setIsLastNotePinned(true);
    // Save the last note directly
    if (lastNote) {
      onSave(lastNote.note);
    }
  };

  // Handle pinning the current note in the input field
  const handlePinCurrentNote = () => {
    if (note.trim()) {
      setIsPinned(true);
      // When pinning a new note, unpin the last note
      setIsLastNotePinned(false);
      onSave(note);
    }
  };

  // Handle unpinning all notes and closing the modal
  const handleUnpinAllNotes = () => {
    // Set local state
    setNote('');
    setIsPinned(false);
    setIsLastNotePinned(false);
    
    // Save null instead of empty string to indicate explicitly unpinned
    onSave(null);
    // Close the modal
    onClose();
  };

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

        {/* Last Note Section */}
        {lastNote && (
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1">
                <History size={12} className="text-gray-500" />
                <h4 className="text-xs font-medium text-gray-700">Last Note</h4>
              </div>
              {isLastNotePinned ? (
                <button 
                  onClick={handleUnpinNote}
                  className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 bg-gray-100 px-2 py-1 rounded"
                >
                  <Pin size={12} className="text-gray-500 fill-current" style={{ transform: 'rotate(45deg)' }} />
                  Unpin
                </button>
              ) : (
                <button 
                  onClick={handlePinLastNote}
                  className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 bg-gray-100 px-2 py-1 rounded"
                >
                  <Pin size={12} className="text-gray-500" />
                  Pin
                </button>
              )}
            </div>
            <div 
              className={`border p-2 rounded-lg cursor-pointer ${isLastNotePinned ? 'bg-yellow-50 border-yellow-200' : 'bg-gray-50 border-gray-200'}`}
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
          placeholder="Pin a new note..."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm min-h-[100px]"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          autoFocus
        />
        <div className="flex space-x-3 mt-4">
          <button
            onClick={handleUnpinAllNotes}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium flex items-center justify-center gap-1 text-gray-600 hover:bg-gray-50"
          >
            <Pin size={14} className="inline" style={{ transform: 'rotate(45deg)' }} />
            Unpin All Notes
          </button>
          <button
            onClick={() => {
              if (note.trim()) {
                // Use handlePinCurrentNote to ensure proper state management
                handlePinCurrentNote();
                // Close the modal
                onClose();
              }
            }}
            className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-1 ${
              note.trim() 
                ? 'bg-blue-600 text-white hover:bg-blue-700' 
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
            disabled={!note.trim()}
          >
            <Pin size={14} className="inline" />
            Pin This Note
          </button>
        </div>
      </div>
    </div>
  );
};