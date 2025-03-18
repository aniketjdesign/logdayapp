import React, { useState, useEffect } from 'react';
import { History, Pin } from 'lucide-react';
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

  // Get the most recent notes for this exercise and set number
  const recentNotes = exerciseId ? workoutLogs
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
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    .slice(0, 2) : []; // Get last 2 pinned notes
    
  // No auto-pinning of previous notes
  useEffect(() => {
    // Initialize with existing comment if available
    if (set.comments) {
      setNote(set.comments);
    }
  }, [set.comments]);

  // Toggle pin/unpin note
  const togglePinNote = () => {
    if (set.comments) {
      // If note is already pinned, unpin it
      if (onUpdateNote) {
        onUpdateNote(null);
      }
    } else if (note.trim() && onUpdateNote) {
      // If note is not pinned, pin it
      onUpdateNote(note);
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
              placeholder={set.comments ? "Unpin to edit note" : "Add a note..."}
              className={`flex-1 px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                set.comments ? 'bg-gray-100 cursor-not-allowed' : ''
              }`}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              disabled={!!set.comments}
              readOnly={!!set.comments}
            />
            
            <div className="flex gap-1">
              <button
                onClick={togglePinNote}
                disabled={!note.trim() && !set.comments}
                className={`p-1.5 rounded-md flex items-center justify-center ${
                  set.comments
                    ? 'bg-amber-500 hover:bg-amber-600' 
                    : note.trim()
                      ? 'bg-blue-600 hover:bg-blue-700'
                      : 'bg-gray-300 cursor-not-allowed'
                }`}
                title={set.comments ? "Unpin note" : "Pin note"}
              >
                <Pin 
                  size={16} 
                  className="text-white" 
                  style={set.comments ? { transform: 'rotate(45deg)' } : undefined} 
                />
              </button>
            </div>
          </div>

          {/* Past Notes Section - showing last 2 pinned notes with date stamp */}
          {recentNotes.length > 0 && (
            <div className="space-y-1 px-1">
              <div className="flex items-center text-xs text-gray-600">
                <History size={12} className="text-gray-400 mr-0.5 flex-shrink-0" />
                <span className="text-xs font-medium text-gray-400">Past Notes</span>
              </div>
              
              {recentNotes.map((pastNote, index) => (
                <div key={index} className="flex items-center text-xs text-gray-600 bg-gray-50 p-1 border-b border-gray-200">
                  <div className="flex flex-row justify-between w-full">
                    <div 
                      className="cursor-pointer hover:text-gray-800 line-clamp-2"
                      onClick={() => setNote(pastNote.note)}
                      title={pastNote.note}
                    >
                      {pastNote.note}
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
