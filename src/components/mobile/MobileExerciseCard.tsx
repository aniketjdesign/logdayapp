import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MoreHorizontal, Plus } from 'lucide-react';
import { Exercise, WorkoutLog } from '../../types/workout';
import { MobileSetRow } from '../MobileSetRow';
import { MobileExerciseTabs } from './MobileExerciseTabs';
import { MobileExerciseHistory } from './MobileExerciseHistory';
import { useSettings } from '../../context/SettingsContext';

interface MobileExerciseCardProps {
  exercise: Exercise;
  sets: any[];
  supersetWith?: string;
  exerciseHistory?: { [exerciseId: string]: WorkoutLog[] };
  weightUnit: string;
  onUpdateSet: (exerciseId: string, setId: string, field: string, value: any) => void;
  onDeleteSet: (exerciseId: string, setId: string) => void;
  onAddSet: (exerciseId: string) => void;
  onOpenNoteModal: (params: { exerciseId: string; setId: string; exerciseName: string; setNumber: number; }) => void;
  onSetComplete: (exerciseId: string) => void;
  onExerciseMenuToggle: (exerciseId: string) => void;
  activeExerciseMenu: string | null;
  renderExerciseMenu: (exerciseId: string) => React.ReactNode;
  supersetPartner?: { exercise: Exercise; sets: any[] };
  animationDelay?: number;
  isInSuperset?: boolean;
}

export const MobileExerciseCard: React.FC<MobileExerciseCardProps> = ({
  exercise,
  sets,
  supersetWith,
  exerciseHistory,
  weightUnit,
  onUpdateSet,
  onDeleteSet,
  onAddSet,
  onOpenNoteModal,
  onSetComplete,
  onExerciseMenuToggle,
  activeExerciseMenu,
  renderExerciseMenu,
  supersetPartner,
  animationDelay = 0,
  isInSuperset = false,
}) => {
  const [activeTab, setActiveTab] = React.useState<'log' | 'previous'>('log');
  const [showChart, setShowChart] = React.useState(false);
  const [logContentHeight, setLogContentHeight] = React.useState<number>(0);
  const logContentRef = React.useRef<HTMLDivElement>(null);
  const [prevSetCount, setPrevSetCount] = useState(sets.length);

  const isBodyweight = exercise.name.includes('(Bodyweight)');
  const isCardio = exercise.muscleGroup === 'Cardio';
  const isTimeBasedCore = exercise.muscleGroup === 'Core' && exercise.metrics?.time;

  // Use the settings context for weight conversion
  const { convertWeight } = useSettings();

  const getPreviousWorkoutSet = (setNumber: number) => {
    if (!exerciseHistory?.[exercise.id]?.length) return null;
    
    // Get the most recent workout
    const lastWorkout = exerciseHistory[exercise.id][0];
    const exerciseData = lastWorkout.exercises.find(e => e.exercise.id === exercise.id);
    
    if (!exerciseData?.sets?.length || setNumber > exerciseData.sets.length) return null;
    
    // Return the set without modifying it - the conversion will happen in the MobileSetRow component
    // where we have access to the convertWeight function
    return exerciseData.sets[setNumber - 1];
  };



  React.useEffect(() => {
    if (logContentRef.current) {
      setLogContentHeight(logContentRef.current.offsetHeight);
    }
  }, [sets]);
  
  // Track when new sets are added
  useEffect(() => {
    setPrevSetCount(sets.length);
  }, [sets.length]);

  return (
    <motion.div 
      className="bg-white rounded-xl shadow-sm relative"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: animationDelay }}
      layout
    >
      <div className="border-b px-3 py-2 border-gray-100">
        <div className="flex justify-between items-center">
          <div className="flex-1">
            <h3 className="font-bold text-sm text-gray-900 pr-2">{exercise.name}</h3>
          </div>
          <div className="flex items-center gap-1">
            <MobileExerciseTabs activeTab={activeTab} onTabChange={setActiveTab} />
            <button
              onClick={() => onExerciseMenuToggle(exercise.id)}
              className="p-2 hover:bg-gray-100 border-gray-100 border text-gray-600 rounded-lg"
            >
              <MoreHorizontal strokeWidth={1.33} size={16} />
            </button>
          </div>
          
        </div>
        {supersetWith && !isInSuperset && (
          <div className="mt-1 flex gap-2 items-start text-sm text-lime-600">
            <div className="w-2.5 h-2.5 mt-1.5 rounded-full bg-lime-500" />
            Supersetted exercise
          </div>
        )}
        {renderExerciseMenu(exercise.id)}
      </div>

      <div className="py-4 pl-4 pr-2 overflow-hidden">
        <AnimatePresence mode="wait" initial={false}>
          {activeTab === 'log' ? (
            <motion.div 
              key="log-tab"
              ref={logContentRef}
              initial={{ opacity: 0, x: -15 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 15 }}
              transition={{ 
                duration: 0.25, 
                ease: [0.25, 0.1, 0.25, 1.0],
                height: { duration: 0.25, ease: [0.33, 1, 0.68, 1] }
              }}
              layout
            >
              <div className="grid grid-cols-[40px_1fr_1fr_1fr_40px] gap-4 mb-2 text-xs font-medium text-gray-400">
              <div>SET</div>
              {isCardio || isTimeBasedCore ? (
                <>
                  <div>TIME</div>
                  {exercise.metrics?.distance && <div>DISTANCE</div>}
                  {exercise.metrics?.difficulty && <div>DIFFICULTY</div>}
                  {exercise.metrics?.incline && <div>INCLINE</div>}
                  {exercise.metrics?.pace && <div>PACE</div>}
                  {exercise.metrics?.reps && <div>REPS</div>}
                </>
              ) : (
                <>
                  <div>{isBodyweight ? 'WEIGHT' : weightUnit.toUpperCase()}</div>
                  <div>GOAL</div>
                  <div>DONE</div>
                </>
              )}
              <div></div>
            </div>

            <AnimatePresence initial={false}>
              {sets.map((set, index) => (
                <motion.div
                  key={set.id}
                  initial={index >= prevSetCount ? { opacity: 0, height: 0, y: -20 } : { opacity: 1, height: 'auto', y: 0 }}
                  animate={{ opacity: 1, height: 'auto', y: 0 }}
                  transition={{ 
                    type: "spring", 
                    stiffness: 300, 
                    damping: 25,
                    duration: 0.3
                  }}
                >
                  <MobileSetRow
                    set={set}
                    exercise={exercise}
                    previousSet={getPreviousWorkoutSet(set.setNumber)}
                    onUpdate={(field, value) => onUpdateSet(exercise.id, set.id, field, value)}
                    onDelete={() => onDeleteSet(exercise.id, set.id)}
                    onOpenNoteModal={() => onOpenNoteModal({
                      exerciseId: exercise.id,
                      setId: set.id,
                      exerciseName: exercise.name,
                      setNumber: set.setNumber
                    })}
                    onSetComplete={() => onSetComplete(exercise.id)}
                    exerciseHistory={exerciseHistory}
                  />
                </motion.div>
              ))}
            </AnimatePresence>

            <button
              onClick={() => onAddSet(exercise.id)}
              className="mt-3 flex items-center px-2.5 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg transition-colors text-sm justify-center"
            >
              <Plus size={14} className="mr-1" />
              Add Set
            </button>
            </motion.div>
          ) : (
            <motion.div
              key="previous-tab"
              initial={{ opacity: 0, x: 15 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -15 }}
              transition={{ 
                duration: 0.25, 
                ease: [0.25, 0.1, 0.25, 1.0],
                height: { duration: 0.25, ease: [0.33, 1, 0.68, 1] }
              }}
              layout
            >
              <MobileExerciseHistory
                exercise={exercise}
                exerciseHistory={exerciseHistory}
                weightUnit={weightUnit}
                showChart={showChart}
                onToggleChart={() => setShowChart(!showChart)}
                contentHeight={logContentHeight}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};
