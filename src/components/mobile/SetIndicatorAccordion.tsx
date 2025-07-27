import React, { useState, useEffect } from 'react';
import { Check, History } from 'lucide-react';
import { WorkoutSet } from '../../types/workout';
import { useWorkout } from '../../context/WorkoutContext';

interface SetIndicatorAccordionProps {
  set: WorkoutSet;
}

interface SetIndicatorAccordionContentProps {
  set: WorkoutSet;
  handleSetTypeUpdate?: (type: 'isWarmup' | 'isDropset' | 'isFailure' | 'isPR', value: boolean) => void;
  hasNonWarmupType: boolean;
  hidePROption?: boolean;
  exerciseId?: string;
  onUpdateNote?: (note: string | null) => void;
}

export const SetIndicatorAccordion: React.FC<SetIndicatorAccordionProps> & {
  Content: React.FC<SetIndicatorAccordionContentProps>
} = ({
  set,
}) => {
  // Get set type abbreviation
  const getSetTypeAbbreviation = () => {
    if (set.isWarmup) return "W";
    if (set.isDropset) return "D";
    if (set.isPR) return "🏆";
    if (set.isFailure && !set.isPR && !set.isDropset) return "F";
    return set.setNumber.toString();
  };

  // Get set type text color
  const getSetTypeTextColor = () => {
    if (set.isWarmup) return "text-orange-600";
    if (set.isDropset) return "text-purple-600";
    if (set.isPR) return "text-yellow-700";
    if (set.isFailure && !set.isPR && !set.isDropset) return "text-red-600";
    return "text-gray-500";
  };

  // Get set type background color
  const getSetTypeBgColor = () => {
    if (set.isWarmup) return "bg-orange-50 border-orange-100";
    if (set.isDropset) return "bg-purple-50 border-purple-100";
    if (set.isPR) return "bg-yellow-50 border-yellow-100";
    if (set.isFailure && !set.isPR && !set.isDropset) return "bg-red-50 border-red-100";
    return "bg-gray-50 border-gray-200";
  };

  return (
    <div 
      className={`flex items-center justify-center w-[34px] h-[34px] rounded-lg border cursor-pointer hover:opacity-90 active:opacity-70 ${getSetTypeBgColor()} ${getSetTypeTextColor()} relative`}
    >
      <span className="text-sm font-medium">{getSetTypeAbbreviation()}</span>
      {/* Calculate the number of indicators */}
      {(() => {
        const indicators = [];
        if (set.isFailure && (set.isPR || set.isDropset)) indicators.push('failure');
        if (set.isPR && set.isDropset) indicators.push('pr');
        
        // If only one indicator, position it at the top right
        if (indicators.length === 1) {
          return (
            <>
              {indicators[0] === 'failure' && (
                <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-red-500 border border-white"></div>
              )}
              {indicators[0] === 'pr' && (
                <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-yellow-400 border border-white"></div>
              )}
            </>
          );
        }
        
        // If exactly two indicators, use a specific layout
        if (indicators.length === 2) {
          return (
            <div className="absolute -right-1 -top-1 flex flex-col space-y-[-5px]">
              {set.isFailure && (set.isPR || set.isDropset) && (
                <div className="w-3 h-3 rounded-full bg-red-500 border border-white"></div>
              )}
              
              {set.isPR && set.isDropset && (
                <div className="w-3 h-3 rounded-full bg-yellow-400 border border-white"></div>
              )}
              
            </div>
          );
        }
        
        // If three indicators, stack them
        if (indicators.length === 3) {
          return (
            <div className="absolute -right-1 -top-0 flex flex-col space-y-[-5px]">
              {set.isFailure && (set.isPR || set.isDropset) && (
                <div className="-mt-1 w-3 h-3 rounded-full bg-red-500 border border-white"></div>
              )}
              
              {set.isPR && set.isDropset && (
                <div className="w-3 h-3 rounded-full bg-yellow-400 border border-white"></div>
              )}
              
            </div>
          );
        }
        
        return null;
      })()}
    </div>
  );
};

// Separate component for the accordion content
SetIndicatorAccordion.Content = ({
  set,
  handleSetTypeUpdate,
  hasNonWarmupType,
  hidePROption = false,
  exerciseId = '',
  onUpdateNote,
}) => {
  const { workoutLogs } = useWorkout();
  
  // Note state
  const [note, setNote] = useState('');
  const [isSaved, setIsSaved] = useState(false);
  const [localNotes, setLocalNotes] = useState<Array<{note: string, date: Date}>>([]);

  // Get the most recent notes for this exercise and set number
  const recentNotes = exerciseId ? workoutLogs
    .flatMap(log => 
      log.exercises
        .filter(ex => ex.exercise.id === exerciseId)
        .flatMap(ex => 
          ex.sets
            .filter(s => 
              s.setNumber === set.setNumber && 
              s.comments
            )
            .map(s => ({
              note: s.comments || '',
              date: new Date(log.startTime)
            }))
            .filter(noteObj => noteObj.note.trim() !== '') // Filter out empty notes
        )
    )
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    .slice(0, 3) : []; // Get last 3 notes from history
    
  // Combine local notes with recent notes from history
  const allNotes = [...localNotes, ...recentNotes]
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    .slice(0, 3); // Show only the 3 most recent notes

  // Initialize with existing comment if available
  useEffect(() => {
    if (set.comments) {
      setNote(set.comments);
      setIsSaved(true);
    } else {
      setNote('');
      setIsSaved(false);
    }
  }, [set.comments]);

  // Save note function
  const saveNote = () => {
    if (note.trim() && onUpdateNote) {
      const noteToSave = note.trim();
      
      // Save the note to the backend
      onUpdateNote(noteToSave);
      setIsSaved(true);
      
      // Don't add to local notes immediately - keep it in the input field
      // The note will appear in past notes in future workouts from workout logs
    }
  };


  // Format date for display
  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
    });
  };

  const buttonStyles = {
    warmup: {
      selected: "bg-orange-100 text-orange-600 border-orange-300",
      default: "bg-orange-50 text-orange-600 border-orange-200 hover:bg-orange-50",
      icon: "bg-orange-500"
    },
    pr: {
      selected: "bg-yellow-100 text-yellow-600 border-yellow-300",
      default: "bg-yellow-50 text-yellow-700 border-yellow-300 hover:bg-yellow-50",
      icon: "bg-yellow-400"
    },
    failure: {
      selected: "bg-red-100 text-red-600 border-red-300",
      default: "bg-red-50 text-red-600 border-red-200 hover:bg-red-50",
      icon: "bg-red-500"
    },
    dropset: {
      selected: "bg-purple-100 text-purple-600 border-purple-300",
      default: "bg-purple-50 text-purple-600 border-purple-200 hover:bg-purple-50",
      icon: "bg-purple-500"
    }
  };

  const getSetTypeButton = (
    type: 'isWarmup' | 'isDropset' | 'isFailure' | 'isPR',
    label: string,
    style: typeof buttonStyles.warmup,
    disabled: boolean = false
  ) => {
    const isSelected = set[type];
    const buttonStyle = isSelected ? style.selected : style.default;
    
    return (
      <button
        onClick={(e) => {
          e.stopPropagation(); // Prevent event from bubbling up
          if (handleSetTypeUpdate) {
            handleSetTypeUpdate(type, !set[type]);
          }
        }}
        disabled={disabled}
        className={`flex flex-col items-center justify-center px-2.5 py-1 rounded-lg border text-sm tracking-tight transition-colors ${buttonStyle} ${
          disabled ? 'opacity-40 cursor-not-allowed' : ''
        }`}
      >
        <div className="flex items-center">
          <span>{label}</span>
        </div>
      </button>
    );
  };

  return (
    <div className="space-y-1">
      {/* Set Type Buttons */}
      <div className="flex flex-row items-center gap-3 py-1">
        {/* Warmup Set */}
        {getSetTypeButton(
          'isWarmup', 
          'Warmup', 
          buttonStyles.warmup, 
          hasNonWarmupType
        )}
        
        {/* PR Set - Only show if not hidden */}
        {!hidePROption && getSetTypeButton(
          'isPR', 
          'PR', 
          buttonStyles.pr, 
          set.isWarmup
        )}
        
        {/* Failure Set */}
        {getSetTypeButton(
          'isFailure', 
          'Failure', 
          buttonStyles.failure, 
          set.isWarmup
        )}
        
        {/* Drop Set */}
        {getSetTypeButton(
          'isDropset', 
          'Dropset', 
          buttonStyles.dropset, 
          set.isWarmup
        )}
      </div>

      {/* Note Section */}
      <div className="pt-1">
        {/* Note input and controls - more compact layout */}
        <div className="space-y-2">
          {/* Compact text input with inline buttons */}
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Add a note..."
              className={`flex-1 px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                isSaved ? 'bg-green-100' : 'bg-white'
              }`}
              value={note}
              onChange={(e) => {
                setNote(e.target.value);
                setIsSaved(false);
              }}
            />
            
            <div className="flex gap-1">
              {/* Save Button (Checkmark) */}
              <button
                onClick={saveNote}
                disabled={!note.trim()}
                className={`p-1.5 rounded-md flex items-center justify-center ${
                  !note.trim() 
                    ? 'bg-gray-300 cursor-not-allowed'
                    : isSaved
                      ? 'bg-green-500 hover:bg-green-600'
                      : 'bg-green-600 hover:bg-green-700'
                }`}
                title="Save note"
              >
                <Check 
                  size={16} 
                  className="text-white" 
                />
              </button>

            </div>
          </div>

          {/* Past Notes Section - showing last 3 notes with date stamp */}
          {allNotes.length > 0 && (
            <div className="space-y-1 px-1">
              <div className="flex items-center text-xs text-gray-600">
                <History size={12} className="text-gray-400 mr-0.5 flex-shrink-0" />
                <span className="text-xs font-medium text-gray-400">Past Notes</span>
              </div>
              
              {allNotes
                .filter(pastNote => pastNote.note.trim() !== '') // Filter out empty notes
                .map((pastNote, index) => (
                <div key={index} className="flex items-center text-xs text-gray-600 bg-gray-50 p-1 border-b border-gray-200">
                  <div className="flex flex-row justify-between w-full">
                    <div 
                      className="cursor-pointer hover:text-gray-800 line-clamp-2 flex items-center"
                      onClick={() => {
                        setNote(pastNote.note);
                        setIsSaved(false);
                      }}
                      title={pastNote.note}
                    >
                      <span>{pastNote.note}</span>
                    </div>
                    <div className="text-gray-400">
                      {formatDate(pastNote.date)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
