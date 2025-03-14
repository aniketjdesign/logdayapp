import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MoreVertical, X, Check } from 'lucide-react';
import { WorkoutSet, Exercise } from '../types/workout';
import { RemoveScroll } from 'react-remove-scroll';
import { SetIndicatorAccordion } from './mobile/SetIndicatorAccordion';

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
  const [inputErrors, setInputErrors] = useState<{weight: boolean; targetReps: boolean; performedReps: boolean}>({weight: false, targetReps: false, performedReps: false});
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

  const getColumnClass = (hasValue: boolean, fieldType: 'weight' | 'targetReps' | 'performedReps') => 
    `px-2 py-1.5 border ${hasValue ? 'border-gray-200' : 'border-gray-200'} ${isSetComplete ? 'bg-green-50 bg-opacity-30' : ''} ${inputErrors[fieldType] ? 'border-red-500 bg-red-50' : ''} rounded-lg text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500 ${hasValue ? '' : 'bg-gray-50 text-gray-400'}`;

  // Check if any non-warmup type is selected
  const hasNonWarmupType = set.isPR || set.isDropset || set.isFailure;

  const handlePerformedRepsChange = (value: string) => {
    onUpdate('performedReps', value);
    // Reset error state for this field
    setInputErrors(prev => ({...prev, performedReps: false}));
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

  // Handle toggling set completion when checkmark is clicked
  const handleCheckToggle = () => {
    // Reset error states
    setInputErrors({weight: false, targetReps: false, performedReps: false});
    
    // If already complete, uncheck it
    if (isSetComplete) {
      // Just toggle the completion state without clearing values
      setIsSetComplete(false);
      return;
    }
    
    // Check if all required fields are filled
    const needsWeight = !set.weight && !isBodyweight && !isTimeBasedCore;
    const needsTargetReps = !set.targetReps && !isCardio && !isTimeBasedCore;
    const needsPerformedReps = !set.performedReps && !isCardio && !isTimeBasedCore;
    const needsTime = !set.time && isTimeBasedCore;
    
    // For cardio exercises, check specific fields based on metrics
    const needsCardioFields = isCardio && (
      (exercise.metrics?.distance && !set.distance) ||
      (exercise.metrics?.difficulty && !set.difficulty) ||
      (exercise.metrics?.incline && !set.incline) ||
      (exercise.metrics?.pace && !set.pace) ||
      (exercise.metrics?.reps && !set.performedReps)
    );
    
    // If any required field is missing, highlight the missing fields
    if (needsWeight || needsTargetReps || needsPerformedReps || needsTime || needsCardioFields) {
      setInputErrors({
        weight: needsWeight,
        targetReps: needsTargetReps,
        performedReps: needsPerformedReps
      });
      
      // Hide errors after 2 seconds
      setTimeout(() => {
        setInputErrors({weight: false, targetReps: false, performedReps: false});
      }, 2000);
      
      return;
    }
    
    // All required fields are filled, mark set as complete
    setIsSetComplete(true);
    setShowCompletionPulse(true);
    
    // Hide the pulse animation after 1 second
    setTimeout(() => setShowCompletionPulse(false), 1000);
    
    if (onSetComplete) {
      onSetComplete();
    }
  };

  // Check if set is complete when component mounts or when set data changes
  useEffect(() => {
    if (set.performedReps || set.time) {
      setIsSetComplete(true);
    } else {
      setIsSetComplete(false);
    }
    
    // Reset error states when set data changes
    setInputErrors({weight: false, targetReps: false, performedReps: false});
  }, [set.performedReps, set.time]);
  
  // Add handlers for input changes to uncheck the set when edited
  const handleWeightChange = (value: string) => {
    onUpdate('weight', value);
    // Reset error state for this field
    setInputErrors(prev => ({...prev, weight: false}));
    // If set was complete and user is editing, mark as incomplete
    if (isSetComplete) {
      setIsSetComplete(false);
    }
  };
  
  const handleTargetRepsChange = (value: string) => {
    onUpdate('targetReps', parseInt(value));
    // Reset error state for this field
    setInputErrors(prev => ({...prev, targetReps: false}));
    // If set was complete and user is editing, mark as incomplete
    if (isSetComplete) {
      setIsSetComplete(false);
    }
  };

  return (
    <>
      <div className="flex flex-col ">
        <div className="relative overflow-hidden">
          {/* Delete action background (always present behind the row) */}
          <div className="absolute inset-0 flex justify-end">
            <div className="bg-red-400 rounded-lg text-white font-medium flex items-center justify-end w-full pr-4">
              Delete
            </div>
          </div>
          
          {/* Main row content that slides */}
          <motion.div
            drag="x"
            dragConstraints={{ left: -150, right: 0 }}
            dragElastic={0.1}
            dragDirectionLock
            onDragEnd={(_, info) => {
              if (info.offset.x < -150) {
                // Delete the set directly
                onDelete();
              }
            }}
            className="relative bg-white rounded-lg"
          >
            <div className="grid grid-cols-[40px_1fr_1fr_1fr_40px] gap-4 items-center py-1">
              {showCompletionPulse && (
                <motion.div 
                  className="absolute inset-0 bg-green-100 rounded-md z-0"
                  initial={{ opacity: 0.7, scale: 0.95 }}
                  animate={{ opacity: 0, scale: 1.05 }}
                  transition={{ duration: 0.8 }}
                />
              )}
              <div className="flex items-center" ref={setNumberRef} onClick={() => setShowSetTypeMenu(!showSetTypeMenu)}>
                <SetIndicatorAccordion 
                  set={set}
                  showSetTypeMenu={showSetTypeMenu}
                />
              </div>

              {/* Weight/Time Column */}
              {isCardio || isTimeBasedCore ? (
                <input
                  type="text"
                  placeholder="mm:ss"
                  className={getColumnClass(true, 'weight')}
                  value={set.time || ''}
                  onChange={handleTimeChange}
                />
              ) : isBodyweight ? (
                <div className={getColumnClass(false, 'weight')}>BW</div>
              ) : (
                <input
                  type="number"
                  step="0.25"
                  min="0"
                  placeholder={previousSet?.weight?.toString() || '-'}
                  className={getColumnClass(true, 'weight')}
                  value={set.weight || ''}
                  onChange={(e) => handleWeightChange(e.target.value)}
                />
              )}

              {/* Target Column */}
              {isCardio ? (
                exercise.metrics?.distance ? (
                  <input
                    type="number"
                    min="0"
                    placeholder="Distance (m)"
                    className={getColumnClass(true, 'targetReps')}
                    value={set.distance || ''}
                    onChange={(e) => onUpdate('distance', parseFloat(e.target.value))}
                  />
                ) : exercise.metrics?.reps ? (
                  <input
                    type="number"
                    min="0"
                    placeholder={previousSet?.performedReps?.toString() || '0'}
                    className={getColumnClass(true, 'performedReps')}
                    value={set.performedReps || ''}
                    onChange={(e) => handlePerformedRepsChange(e.target.value)}
                    onBlur={handlePerformedRepsBlur}
                  />
                ) : (
                  <div className={getColumnClass(false, 'performedReps')}>-</div>
                )
              ) : isTimeBasedCore ? (
                <div className={getColumnClass(false, 'performedReps')}>-</div>
              ) : (
                <input
                  type="number"
                  min="0"
                  placeholder={previousSet?.performedReps?.toString() || '0'}
                  className={getColumnClass(true, 'targetReps')}
                  value={set.targetReps || ''}
                  onChange={(e) => handleTargetRepsChange(e.target.value)}
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
                    className={getColumnClass(true, 'targetReps')}
                    value={set.difficulty || ''}
                    onChange={(e) => onUpdate('difficulty', parseInt(e.target.value))}
                  />
                ) : exercise.metrics?.incline ? (
                  <input
                    type="number"
                    min="0"
                    max="15"
                    placeholder="Incline %"
                    className={getColumnClass(true, 'targetReps')}
                    value={set.incline || ''}
                    onChange={(e) => onUpdate('incline', parseInt(e.target.value))}
                  />
                ) : exercise.metrics?.pace ? (
                  <input
                    type="text"
                    placeholder="Pace"
                    className={getColumnClass(true, 'performedReps')}
                    value={set.pace || ''}
                    onChange={(e) => onUpdate('pace', e.target.value)}
                  />
                ) : (
                  <div className={getColumnClass(false, 'performedReps')}>-</div>
                )
              ) : isTimeBasedCore ? (
                <div className={getColumnClass(false, 'performedReps')}>-</div>
              ) : (
                <input
                  type="number"
                  min="0"
                  placeholder="0"
                  className={getColumnClass(true, 'performedReps')}
                  value={set.performedReps || ''}
                  onChange={(e) => handlePerformedRepsChange(e.target.value)}
                  onBlur={handlePerformedRepsBlur}
                />
              )}

              <div className="flex items-center gap-1">
                <button
                  onClick={handleCheckToggle}
                  className={`p-1 hover:bg-gray-100 rounded-lg flex justify-center items-center h-8`}
                  title={isSetComplete ? "Mark as incomplete" : "Auto-fill set data"}
                >
                  {isSetComplete ? (
                    <div className="w-4 h-4 rounded-full bg-green-600 flex items-center justify-center">
                      <Check size={10} strokeWidth={2.5} className="text-white" />
                    </div>
                  ) : (
                    <div className="w-4 h-4 rounded-full border border-gray-400 flex items-center justify-center">
                      <Check size={10} strokeWidth={2} className="text-gray-400" />
                    </div>
                  )}
                </button>
                
                {/* <button
                  onClick={() => setShowMenu(true)}
                  className="p-1 hover:bg-gray-100 text-gray-600 rounded-lg flex justify-center items-center h-8"
                >
                  <MoreVertical strokeWidth={1} size={16} />
                </button> */}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Accordion content */}
        <AnimatePresence>
          {showSetTypeMenu && (
            <motion.div 
              key="accordion-content"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="px-2 rounded-lg pb-2 pt-1 bg-gray-50 rounded-b-lg mb-2 mt-1 border-t border-gray-100 overflow-hidden"
            >
              <SetIndicatorAccordion.Content
                set={set}
                handleSetTypeUpdate={(type: 'isWarmup' | 'isDropset' | 'isFailure' | 'isPR', value: boolean) => {
                  onUpdate(type, value);
                  // Don't close the accordion after selection
                }}
                hasNonWarmupType={hasNonWarmupType}
                exerciseId={exercise.id}
                onUpdateNote={(note: string | null) => {
                  onUpdate('comments', note);
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>

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