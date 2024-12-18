import React from 'react';
import { MoreHorizontal, Plus, FileText, BarChart2 } from 'lucide-react';
import { Exercise, WorkoutLog } from '../../types/workout';
import { MobileSetRow } from '../MobileSetRow';
import { MobileExerciseTabs } from './MobileExerciseTabs';
import { MobileExerciseHistory } from './MobileExerciseHistory';

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
}) => {
  const [activeTab, setActiveTab] = React.useState<'log' | 'previous'>('log');
  const [showChart, setShowChart] = React.useState(false);
  const [logContentHeight, setLogContentHeight] = React.useState<number>(0);
  const logContentRef = React.useRef<HTMLDivElement>(null);
  const isBodyweight = exercise.name.includes('(Bodyweight)');
  const isCardio = exercise.muscleGroup === 'Cardio';
  const isTimeBasedCore = exercise.muscleGroup === 'Core' && exercise.metrics?.time;

  const getPreviousWorkoutSet = (setNumber: number) => {
    if (!exerciseHistory?.[exercise.id]?.length) return null;
    
    // Get the most recent workout
    const lastWorkout = exerciseHistory[exercise.id][0];
    const exerciseData = lastWorkout.exercises.find(e => e.exercise.id === exercise.id);
    
    if (!exerciseData?.sets?.length || setNumber > exerciseData.sets.length) return null;
    
    return exerciseData.sets[setNumber - 1];
  };

  React.useEffect(() => {
    if (logContentRef.current) {
      setLogContentHeight(logContentRef.current.offsetHeight);
    }
  }, [sets, supersetPartner]);

  return (
    <div className="bg-white rounded-xl shadow-sm">
      <div className="border-b px-3 py-2 border-gray-100">
        <div className="flex justify-between items-center">
          <div className="flex-1">
            <h3 className="font-bold text-[15px] text-gray-900 pr-2">{exercise.name}</h3>
            {supersetPartner && (
              <div className="mt-1 flex gap-2 items-center text-sm text-lime-600">
                <div className="w-2.5 h-2.5 rounded-full bg-lime-500" />
                Superset w/ {supersetPartner.exercise.name}
              </div>
            )}
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
        {activeExerciseMenu === exercise.id && renderExerciseMenu(exercise.id)}
      </div>

      <div className="p-4">
        {activeTab === 'log' ? (
          <div ref={logContentRef}>
            <div className="grid grid-cols-[50px_1fr_1fr_1fr_32px] gap-2 mb-2 text-xs font-medium text-gray-500">
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

            {sets.map((set) => (
              <MobileSetRow
                key={set.id}
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
              />
            ))}

            {!supersetPartner && (
              <button
                onClick={() => onAddSet(exercise.id)}
                className="mt-3 flex items-center px-2.5 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg transition-colors text-sm justify-center"
              >
                <Plus size={14} className="mr-1" />
                Add Set
              </button>
            )}

            {supersetPartner && (
              <>
                <button
                  onClick={() => onAddSet(exercise.id)}
                  className="mt-3 flex items-center px-2.5 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg transition-colors text-sm justify-center"
                >
                  <Plus size={14} className="mr-1" />
                  Add Set
                </button>

                <div className="my-4 border-t border-lime-500" />
                <div className="mb-2">
                  <h4 className="text-sm font-medium text-gray-700">{supersetPartner.exercise.name}</h4>
                </div>
                {supersetPartner.sets.map((set) => (
                  <MobileSetRow
                    key={set.id}
                    set={set}
                    exercise={supersetPartner.exercise}
                    previousSet={getPreviousWorkoutSet(set.setNumber)}
                    onUpdate={(field, value) => onUpdateSet(supersetPartner.exercise.id, set.id, field, value)}
                    onDelete={() => onDeleteSet(supersetPartner.exercise.id, set.id)}
                    onOpenNoteModal={() => onOpenNoteModal({
                      exerciseId: supersetPartner.exercise.id,
                      setId: set.id,
                      exerciseName: supersetPartner.exercise.name,
                      setNumber: set.setNumber
                    })}
                    onSetComplete={() => onSetComplete(supersetPartner.exercise.id)}
                  />
                ))}
                <button
                  onClick={() => onAddSet(supersetPartner.exercise.id)}
                  className="mt-3 flex items-center px-4 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors text-sm justify-center"
                >
                  <Plus size={16} className="mr-2" />
                  Add Set
                </button>
              </>
            )}
          </div>
        ) : (
          <>
            <MobileExerciseHistory
              exercise={exercise}
              exerciseHistory={exerciseHistory}
              weightUnit={weightUnit}
              showChart={showChart}
              onToggleChart={() => setShowChart(!showChart)}
              contentHeight={logContentHeight}
            />
            
            {supersetPartner && (
              <>
                <div className="my-4 border-t border-lime-500" />
                <div className="mb-2">
                  <h4 className="text-sm font-medium text-gray-700">{supersetPartner.exercise.name}</h4>
                </div>
                <MobileExerciseHistory
                  exercise={supersetPartner.exercise}
                  exerciseHistory={exerciseHistory}
                  weightUnit={weightUnit}
                  showChart={showChart}
                  onToggleChart={() => setShowChart(!showChart)}
                  contentHeight={logContentHeight}
                />
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
};
