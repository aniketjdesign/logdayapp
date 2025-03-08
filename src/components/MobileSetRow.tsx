import React, { useState, useRef } from 'react';
import { MoreVertical, X, MessageSquare } from 'lucide-react';
import { WorkoutSet, Exercise } from '../types/workout';
import { RemoveScroll } from 'react-remove-scroll';

interface MobileSetRowProps {
  set: WorkoutSet;
  exercise: Exercise;
  previousSet?: WorkoutSet | null;
  onUpdate: (field: string, value: any) => void;
  onDelete: () => void;
  onOpenNoteModal: () => void;
  onSetComplete?: () => void;
}

export const MobileSetRow: React.FC<MobileSetRowProps> = ({
  set,
  exercise,
  previousSet,
  onUpdate,
  onDelete,
  onOpenNoteModal,
  onSetComplete,
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [showSetTypeMenu, setShowSetTypeMenu] = useState(false);
  const isCardio = exercise.muscleGroup === 'Cardio';
  const isTimeBasedCore = exercise.muscleGroup === 'Core' && exercise.metrics?.time;
  const isBodyweight = exercise.name.includes('(Bodyweight)');
  const menuRef = useRef<HTMLDivElement>(null);
  const setTypeMenuRef = useRef<HTMLDivElement>(null);
  const setNumberRef = useRef<HTMLDivElement>(null);

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    
    if (value.length < (set.time || '').length) {
      onUpdate('time', value);
      return;
    }

    const digits = value.replace(/\D/g, '');
    
    if (digits.length <= 2) {
      const seconds = parseInt(digits || '0');
      if (seconds < 60) {
        onUpdate('time', `0:${digits.padStart(2, '0')}`);
      }
    } else {
      const minutes = parseInt(digits.slice(0, -2));
      const seconds = parseInt(digits.slice(-2));
      if (seconds < 60) {
        onUpdate('time', `${minutes}:${seconds.toString().padStart(2, '0')}`);
      }
    }
  };

  const getColumnClass = (hasValue: boolean) => 
    `px-2 py-1.5 border ${hasValue ? 'border-gray-200' : 'border-gray-200'} rounded-lg text-sm w-full ${hasValue ? '' : 'bg-gray-50 text-gray-400'}`;

  const handleSetTypeUpdate = (type: 'isWarmup' | 'isDropset' | 'isFailure' | 'isPR', value: boolean) => {
    onUpdate(type, value);
    setShowSetTypeMenu(false);
  };

  // Check if any non-warmup type is selected
  const hasNonWarmupType = set.isPR || set.isDropset || set.isFailure;

  const handlePerformedRepsChange = (value: string) => {
    onUpdate('performedReps', value);
  };

  const handlePerformedRepsBlur = () => {
    // Only trigger rest timer if there's a valid value
    if (set.performedReps && onSetComplete) {
      onSetComplete();
    }
  };

  const NewTag = () => (
    <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-600">
      NEW
    </span>
  );

  const getSetTypeButton = (
    type: 'isWarmup' | 'isDropset' | 'isFailure' | 'isPR',
    label: string,
    color: string,
    isNew: boolean = false,
    disabled: boolean = false
  ) => (
    <button
      onClick={() => {
        handleSetTypeUpdate(type, !set[type]);
      }}
      disabled={disabled}
      className={`w-full px-4 py-2 text-left text-sm flex items-center justify-between ${
        disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'
      } rounded-lg`}
    >
      <div className="flex items-center">
        <div className={`w-3 h-3 rounded-full ${color} mr-3`} />
        <span>{set[type] ? `Remove ${label}` : `${label}`}</span>
      </div>
      {isNew && <NewTag />}
    </button>
  );

  const noteButton = (
    <button
      onClick={() => {
        onOpenNoteModal();
        setShowMenu(false);
      }}
      className="w-full px-4 py-3 text-left text-base flex items-center justify-between hover:bg-gray-50 rounded-lg"
    >
      <div className="flex items-center">
        <div className="w-3 h-3 rounded-full bg-blue-500 mr-3" />
        <span>{set.comments ? 'View Note' : 'Add Note'}</span>
      </div>
    </button>
  );

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
    <>
      <div className="grid grid-cols-[40px_1fr_1fr_1fr_32px] gap-4 items-center py-1 relative">
        <div className="flex items-center" ref={setNumberRef}>
          <div 
            className={`flex items-center justify-center w-[34px] h-[34px] rounded-lg border cursor-pointer hover:opacity-90 ${getSetTypeBgColor()} ${getSetTypeTextColor()} relative`}
            onClick={() => setShowSetTypeMenu(true)}
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
      </div>

      {/* Weight/Time Column */}
      {isCardio || isTimeBasedCore ? (
        <input
          type="text"
          placeholder="mm:ss"
          className={getColumnClass(true)}
          value={set.time || ''}
          onChange={handleTimeChange}
        />
      ) : isBodyweight ? (
        <div className={getColumnClass(false)}>BW</div>
      ) : (
        <input
          type="number"
          step="0.25"
          min="0"
          placeholder={previousSet?.weight?.toString() || '-'}
          className={getColumnClass(true)}
          value={set.weight || ''}
          onChange={(e) => onUpdate('weight', e.target.value)}
        />
      )}

      {/* Target Column */}
      {isCardio ? (
        exercise.metrics?.distance ? (
          <input
            type="number"
            min="0"
            placeholder="Distance (m)"
            className={getColumnClass(true)}
            value={set.distance || ''}
            onChange={(e) => onUpdate('distance', parseFloat(e.target.value))}
          />
        ) : exercise.metrics?.reps ? (
          <input
            type="number"
            min="0"
            placeholder={previousSet?.performedReps?.toString() || '0'}
            className={getColumnClass(true)}
            value={set.performedReps || ''}
            onChange={(e) => handlePerformedRepsChange(e.target.value)}
            onBlur={handlePerformedRepsBlur}
          />
        ) : (
          <div className={getColumnClass(false)}>-</div>
        )
      ) : isTimeBasedCore ? (
        <div className={getColumnClass(false)}>-</div>
      ) : (
        <input
          type="number"
          min="0"
          placeholder={previousSet?.performedReps?.toString() || '0'}
          className={getColumnClass(true)}
          value={set.targetReps || ''}
          onChange={(e) => onUpdate('targetReps', parseInt(e.target.value))}
        />
      )}

      {/* Actual Column */}
      {isCardio ? (
        exercise.metrics?.difficulty ? (
          <input
            type="number"
            min="0"
            max="20"
            placeholder="Difficulty"
            className={getColumnClass(true)}
            value={set.difficulty || ''}
            onChange={(e) => onUpdate('difficulty', parseInt(e.target.value))}
          />
        ) : exercise.metrics?.incline ? (
          <input
            type="number"
            min="0"
            max="15"
            placeholder="Incline %"
            className={getColumnClass(true)}
            value={set.incline || ''}
            onChange={(e) => onUpdate('incline', parseInt(e.target.value))}
          />
        ) : exercise.metrics?.pace ? (
          <input
            type="text"
            placeholder="Pace"
            className={getColumnClass(true)}
            value={set.pace || ''}
            onChange={(e) => onUpdate('pace', e.target.value)}
          />
        ) : (
          <div className={getColumnClass(false)}>-</div>
        )
      ) : isTimeBasedCore ? (
        <div className={getColumnClass(false)}>-</div>
      ) : (
        <input
          type="number"
          min="0"
          placeholder="0"
          className={getColumnClass(true)}
          value={set.performedReps}
          onChange={(e) => handlePerformedRepsChange(e.target.value)}
          onBlur={handlePerformedRepsBlur}
        />
      )}

      <button
        onClick={() => setShowMenu(true)}
        className="p-1 hover:bg-gray-100 text-gray-600 rounded-lg flex justify-center items-center h-8"
      >
        <MoreVertical strokeWidth={1} size={16} />
      </button>
      </div>
      
      {/* Set Type Popover Menu */}
      {showSetTypeMenu && (
        <div className="fixed inset-0 z-40" onClick={() => setShowSetTypeMenu(false)}>
          <div 
            ref={setTypeMenuRef}
            className="absolute bg-white rounded-lg shadow-lg z-50 w-48 p-2 border border-gray-200"
            style={{
              top: setNumberRef.current ? setNumberRef.current.getBoundingClientRect().bottom + 5 : 0,
              left: setNumberRef.current ? setNumberRef.current.getBoundingClientRect().left : 0
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="space-y-1">
              {/* Warmup Set */}
              {getSetTypeButton('isWarmup', 'Warmup', 'bg-orange-500', false, hasNonWarmupType)}
              
              {/* PR Set */}
              {getSetTypeButton('isPR', 'PR', 'bg-yellow-400', false, set.isWarmup)}
              
              {/* Failure Set */}
              {getSetTypeButton('isFailure', 'Failure', 'bg-red-500', false, set.isWarmup)}
              
              {/* Drop Set */}
              {getSetTypeButton('isDropset', 'Dropset', 'bg-purple-500', false, set.isWarmup)}
            </div>
          </div>
        </div>
      )}
      
      {/* Main Options Menu */}
      {showMenu && (
        <RemoveScroll>
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setShowMenu(false)}
          />
          <div 
            ref={menuRef}
            className="fixed bottom-0 left-0 right-0 bg-white rounded-t-xl z-50 animate-slide-up"
          >
            <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto my-3" />
            
            {/* Header */}
            <div className="px-4 pb-4 border-b">
              <h3 className="font-semibold text-lg">{exercise.name}</h3>
              <p className="text-sm text-gray-600">Set {set.setNumber}</p>
            </div>
            
            <div className="p-4 space-y-2">              
              {/* Add Note */}
              {noteButton}
              
              {/* Delete Set */}
              <button
                onClick={() => {
                  onDelete();
                  setShowMenu(false);
                }}
                className="w-full px-4 py-3 text-left text-base flex items-center space-x-3 hover:bg-gray-50 rounded-lg text-red-600"
              >
                <X size={16} />
                <span>Delete Set</span>
              </button>
            </div>
          </div>
        </RemoveScroll>
      )}
    </>
  );
};