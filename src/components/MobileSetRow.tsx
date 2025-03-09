import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MoreVertical, X } from 'lucide-react';
import { WorkoutSet, Exercise } from '../types/workout';
import { RemoveScroll } from 'react-remove-scroll';
import { SetIndicatorPopover } from './mobile/SetIndicatorPopover';

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
  const [isSetComplete, setIsSetComplete] = useState(false);
  const [showCompletionPulse, setShowCompletionPulse] = useState(false);
  const isCardio = exercise.muscleGroup === 'Cardio';
  const isTimeBasedCore = exercise.muscleGroup === 'Core' && exercise.metrics?.time;
  const isBodyweight = exercise.name.includes('(Bodyweight)');
  const menuRef = useRef<HTMLDivElement>(null);
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
    `px-2 py-1.5 border ${hasValue ? 'border-gray-200' : 'border-gray-200'} ${isSetComplete ? 'bg-green-50 bg-opacity-30' : ''} rounded-lg text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500 ${hasValue ? '' : 'bg-gray-50 text-gray-400'}`;

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
    if (set.performedReps) {
      setIsSetComplete(true);
      setShowCompletionPulse(true);
      
      // Hide the pulse animation after 1 second
      setTimeout(() => setShowCompletionPulse(false), 1000);
      
      if (onSetComplete) {
        onSetComplete();
      }
    }
  };

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



  // Check if set is complete when component mounts or when set data changes
  useEffect(() => {
    if (set.performedReps || set.time) {
      setIsSetComplete(true);
    } else {
      setIsSetComplete(false);
    }
  }, [set.performedReps, set.time]);

  return (
    <>
      <div className="grid grid-cols-[40px_1fr_1fr_1fr_32px] gap-4 items-center py-1 relative">
        {showCompletionPulse && (
          <motion.div 
            className="absolute inset-0 bg-green-100 rounded-md z-0"
            initial={{ opacity: 0.7, scale: 0.95 }}
            animate={{ opacity: 0, scale: 1.05 }}
            transition={{ duration: 0.8 }}
          />
        )}
        <div className="flex items-center" ref={setNumberRef}>
          <SetIndicatorPopover 
            set={set}
            showSetTypeMenu={showSetTypeMenu}
            setShowSetTypeMenu={setShowSetTypeMenu}
            setNumberRef={setNumberRef}
            handleSetTypeUpdate={handleSetTypeUpdate}
            hasNonWarmupType={hasNonWarmupType}
          />
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