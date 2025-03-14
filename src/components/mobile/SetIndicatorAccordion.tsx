import React, { useState, useEffect } from 'react';
import { History, Pin } from 'lucide-react';
import { WorkoutSet } from '../../types/workout';
import { useWorkout } from '../../context/WorkoutContext';

interface SetIndicatorAccordionProps {
  set: WorkoutSet;
  showSetTypeMenu: boolean;
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
  showSetTypeMenu,
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
        if (set.comments) indicators.push('notes');
        
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
              {indicators[0] === 'notes' && (
                <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-blue-500 border border-white"></div>
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
              
              {set.comments && (
                <div className="w-3 h-3 rounded-full bg-blue-500 border border-white"></div>
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
              
              {set.comments && (
                <div className="w-3 h-3 rounded-full bg-blue-500 border border-white"></div>
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
  const [note, setNote] = useState(set.comments || '');

  // Get the most recent note for this exercise and set number
  const lastNote = exerciseId ? workoutLogs
    .flatMap(log => 
      log.exercises
        .filter(ex => ex.exercise.id === exerciseId)
        .flatMap(ex => 
          ex.sets
            .filter((s, index) => index + 1 === set.setNumber && s.comments && s.comments.trim().length > 0)
            .map(s => ({
              note: s.comments,
              date: new Date(log.startTime)
            }))
        )
    )
    .sort((a, b) => b.date.getTime() - a.date.getTime())[0] : null;
    
  // Set the last note as pinned by default when it's available
  useEffect(() => {
    if (lastNote && !set.comments) {
      setNote(lastNote.note);
    }
  }, [lastNote, set.comments]);

  // Handle unpinning all notes
  const handleUnpinAllNotes = () => {
    setNote('');
    if (onUpdateNote) {
      onUpdateNote(null);
    }
  };

  // Pin the last note
  const handlePinLastNote = () => {
    if (lastNote && onUpdateNote) {
      onUpdateNote(lastNote.note);
    }
  };

  // Handle pinning the current note
  const handlePinCurrentNote = () => {
    if (note.trim() && onUpdateNote) {
      onUpdateNote(note);
    }
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
    isNew: boolean = false,
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
        className={`flex flex-col items-center justify-center px-2 py-1.5 rounded-lg border text-xs font-medium transition-colors ${buttonStyle} ${
          disabled ? 'opacity-40 cursor-not-allowed' : ''
        }`}
      >
        <div className="flex items-center">
          <span>{label}</span>
          {isNew && <span className="ml-1 inline-flex items-center px-1 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-600">NEW</span>}
        </div>
      </button>
    );
  };

  return (
    <div className="space-y-1">
      {/* Set Type Buttons */}
      <div className="flex flex-row items-center gap-4 py-1">
        {/* Warmup Set */}
        {getSetTypeButton(
          'isWarmup', 
          'Warmup', 
          buttonStyles.warmup, 
          false, 
          hasNonWarmupType
        )}
        
        {/* PR Set - Only show if not hidden */}
        {!hidePROption && getSetTypeButton(
          'isPR', 
          'PR', 
          buttonStyles.pr, 
          false, 
          set.isWarmup
        )}
        
        {/* Failure Set */}
        {getSetTypeButton(
          'isFailure', 
          'Failure', 
          buttonStyles.failure, 
          false, 
          set.isWarmup
        )}
        
        {/* Drop Set */}
        {getSetTypeButton(
          'isDropset', 
          'Dropset', 
          buttonStyles.dropset, 
          false, 
          set.isWarmup
        )}
      </div>

      {/* Note Section */}
      <div className="border-t border-gray-100 pt-2 mt-1">
        {/* Note input and controls - more compact layout */}
        <div className="space-y-2">
          {/* Compact text input with inline buttons */}
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Add a note..."
              className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded-md"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
            
            <div className="flex gap-1">
              {set.comments && (
                <button
                  onClick={handleUnpinAllNotes}
                  className="p-1 text-gray-500 hover:text-gray-700 rounded-md"
                  title="Unpin note"
                >
                  <Pin size={14} style={{ transform: 'rotate(45deg)' }} />
                </button>
              )}
              <button
                onClick={() => {
                  if (note.trim()) {
                    handlePinCurrentNote();
                  }
                }}
                disabled={!note.trim()}
                className={`p-1 rounded-md ${
                  note.trim() 
                    ? 'text-blue-600 hover:text-blue-700' 
                    : 'text-gray-300 cursor-not-allowed'
                }`}
                title="Pin note"
              >
                <Pin size={14} />
              </button>
            </div>
          </div>

          {/* Last Note - shown in a more compact way */}
          {lastNote && !set.comments && (
            <div className="flex items-center text-xs gap-1 text-gray-600">
              <History size={12} className="text-gray-500 flex-shrink-0" />
              <span 
                className="flex-1 cursor-pointer hover:text-gray-800 truncate"
                onClick={() => setNote(lastNote.note)}
                title={lastNote.note}
              >
                {lastNote.note}
              </span>
              <button
                onClick={handlePinLastNote}
                className="text-gray-500 hover:text-blue-600 p-0.5 rounded-md flex-shrink-0"
                title="Pin previous note"
              >
                <Pin size={12} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
