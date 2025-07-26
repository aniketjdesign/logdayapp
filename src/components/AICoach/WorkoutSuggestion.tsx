import React, { useState } from 'react';
import { Play, Clock, Dumbbell, Target, Check, Zap, Timer } from 'lucide-react';
import { Exercise, WorkoutExercise, MuscleGroup } from '../../types/workout';
import { exercises } from '../../data/exercises';
import { exerciseService } from '../../services/exerciseService';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useWorkout } from '../../context/WorkoutContext';
import { generateUUID } from '../../utils/uuid';

interface WorkoutSuggestionProps {
  workoutPlan: ParsedWorkoutPlan;
  onStartWorkout?: (exercises: WorkoutExercise[]) => void;
}

interface ParsedWorkoutPlan {
  name: string;
  description?: string;
  duration?: number;
  exercises: ParsedExercise[];
}

interface ParsedExercise {
  name: string;
  muscleGroup?: MuscleGroup;
  sets: number;
  reps: number | string;
  weight?: number;
  notes?: string;
}

// Function to generate cool workout names based on muscle groups
const generateCoolWorkoutName = (exercises: ParsedExercise[]): string => {
  // Safety check for exercises array
  if (!exercises || !Array.isArray(exercises) || exercises.length === 0) {
    return 'Custom Workout';
  }
  
  // Extract unique muscle groups from exercises with null safety
  const muscleGroups = [...new Set(
    exercises
      .filter(ex => ex && typeof ex === 'object')
      .map(ex => ex.muscleGroup)
      .filter(group => group && typeof group === 'string')
  )];
  
  // Cool name templates for different muscle groups
  const nameTemplates: Record<string, string[]> = {
    legs: ['Leg Crusher', 'Thunder Thighs', 'Quad Destroyer', 'Leg Dominator', 'Lower Body Annihilator'],
    chest: ['Chest Blaster', 'Pec Destroyer', 'Chest Crusher', 'Iron Chest', 'Pec Power'],
    back: ['Back Breaker', 'Lat Destroyer', 'Back Attack', 'Wing Builder', 'Back Dominator'],
    shoulders: ['Shoulder Shredder', 'Delt Destroyer', 'Shoulder Crusher', 'Boulder Shoulders', 'Shoulder Storm'],
    arms: ['Arm Annihilator', 'Bicep Blaster', 'Gun Show', 'Arm Destroyer', 'Sleeve Buster'],
    biceps: ['Bicep Bomber', 'Curl Crusher', 'Peak Builder', 'Bicep Blaster', 'Gun Show'],
    triceps: ['Tricep Terror', 'Horseshoe Builder', 'Tricep Crusher', 'Arm Shaper', 'Tricep Destroyer'],
    core: ['Core Crusher', 'Ab Annihilator', 'Core Destroyer', 'Six Pack Attack', 'Core Dominator'],
    glutes: ['Glute Blaster', 'Booty Builder', 'Glute Destroyer', 'Power Glutes', 'Glute Dominator'],
    calves: ['Calf Crusher', 'Calf Destroyer', 'Lower Leg Blaster', 'Calf Builder', 'Calf Attack'],
    cardio: ['Cardio Crusher', 'Heart Pounder', 'Endurance Builder', 'Cardio Destroyer', 'Stamina Storm']
  };
  
  // If no muscle groups found, return a generic cool name
  if (muscleGroups.length === 0) {
    const genericNames = ['Beast Mode', 'Iron Will', 'Power Session', 'Strength Storm', 'Muscle Mayhem'];
    return genericNames[Math.floor(Math.random() * genericNames.length)];
  }
  
  // For single muscle group, pick a random name from that group
  if (muscleGroups.length === 1) {
    const group = muscleGroups[0]?.toLowerCase();
    const templates = (group && nameTemplates[group]) || nameTemplates['cardio'];
    return templates[Math.floor(Math.random() * templates.length)];
  }
  const compoundNames = [
    'Full Body Destroyer',
    'Total Annihilation',
    'Complete Crusher',
    'Ultimate Shredder',
    'Beast Mode Activated',
    'Iron Warrior',
    'Muscle Mayhem',
    'Power Fusion'
  ];
  
  // If it's an upper/lower split, be more specific
  const upperGroups = ['chest', 'back', 'shoulders', 'arms', 'biceps', 'triceps'];
  const lowerGroups = ['legs', 'glutes', 'calves'];
  
  const isUpperBody = muscleGroups.some(group => group && upperGroups.includes(group.toLowerCase()));
  const isLowerBody = muscleGroups.some(group => group && lowerGroups.includes(group.toLowerCase()));
  
  if (isUpperBody && !isLowerBody) {
    const upperNames = ['Upper Body Destroyer', 'Torso Terror', 'Upper Annihilator', 'Top Half Crusher'];
    return upperNames[Math.floor(Math.random() * upperNames.length)];
  }
  
  if (isLowerBody && !isUpperBody) {
    const lowerNames = ['Lower Body Destroyer', 'Leg Day Mayhem', 'Lower Annihilator', 'Bottom Half Crusher'];
    return lowerNames[Math.floor(Math.random() * lowerNames.length)];
  }
  
  return compoundNames[Math.floor(Math.random() * compoundNames.length)];
};

export const WorkoutSuggestion: React.FC<WorkoutSuggestionProps> = ({ 
  workoutPlan
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [allExercises, setAllExercises] = useState<Exercise[]>([]);
  const navigate = useNavigate();
  const { startWorkout } = useWorkout();

  // Load all exercises (built-in + custom) on component mount
  React.useEffect(() => {
    const loadAllExercises = async () => {
      try {
        const customExercises = await exerciseService.getUserExercises();
        const combinedExercises = [
          // Filter built-in exercises to ensure they're valid
          ...exercises.filter(ex => ex && ex.name && ex.muscleGroup),
          // Filter and map custom exercises
          ...customExercises
            .filter(ex => ex && ex.name && ((ex as any).muscleGroup || ex.muscle_group))
            .map(ex => ({
              id: ex.id,
              name: ex.name,
              muscleGroup: (ex as any).muscleGroup || ex.muscle_group,
              category: ex.category || 'Custom',
              instruction: ex.instruction,
              aliases: []
            }))
        ];
        setAllExercises(combinedExercises);
      } catch (error) {
        console.error('Error loading exercises:', error);
        // Fallback to built-in exercises with filtering
        setAllExercises(exercises.filter(ex => ex && ex.name && ex.muscleGroup));
      }
    };
    
    loadAllExercises();
  }, []);

  const findExerciseByName = (name: string): Exercise | null => {
    // Check if name is valid
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      console.warn('Invalid exercise name provided');
      return null;
    }

    // Check if exercises array exists and has valid exercises
    if (!allExercises || !Array.isArray(allExercises) || allExercises.length === 0) {
      console.warn('Exercises data not available');
      return null;
    }

    // Filter out any undefined/null exercises
    const validExercises = allExercises.filter(ex => ex && ex.name);

    // Clean and normalize the exercise name for better matching
    const cleanName = name.toLowerCase().trim();
    
    // First try exact match
    let found = validExercises.find(ex => 
      ex.name.toLowerCase() === cleanName ||
      ex.aliases?.some(alias => alias?.toLowerCase() === cleanName)
    );

    if (!found) {
      // Try partial match
      found = validExercises.find(ex => 
        ex.name.toLowerCase().includes(cleanName) ||
        cleanName.includes(ex.name.toLowerCase()) ||
        ex.aliases?.some(alias => 
          alias?.toLowerCase().includes(cleanName) || 
          cleanName.includes(alias?.toLowerCase() || '')
        )
      );
    }

    // Common exercise name mappings for built-in exercises
    const commonMappings: { [key: string]: string } = {
      'bench press': 'Flat Chest Press (Bench)',
      'squat': 'Barbell Squats',
      'deadlift': 'Deadlifts',
      'pull up': 'Wide-grip Pullups (Bodyweight)',
      'pullup': 'Wide-grip Pullups (Bodyweight)',
      'push up': 'Pushup (Bodyweight)',
      'pushup': 'Pushup (Bodyweight)',
      'shoulder press': 'Seated Shoulder Press (Dumbbells)',
      'overhead press': 'Seated Shoulder Press (Dumbbells)',
      'row': 'Barbell Rows',
      'curl': 'Bicep Curls (Dumbbells)',
      'tricep extension': 'Tricep Extensions (Dumbbell Both Hands)',
      'leg press': 'Leg Press (Generic)',
      'lat pulldown': 'Lat Pulldown - Wide',
      'chest fly': 'Flat Bench Flies (Dumbbells)'
    };

    if (!found && commonMappings[cleanName]) {
      found = validExercises.find(ex => ex.name === commonMappings[cleanName]);
    }

    return found || null;
  };

  const generateWorkoutExercises = (): WorkoutExercise[] => {
    try {
      // Safety check for workoutPlan and exercises
      if (!workoutPlan?.exercises || !Array.isArray(workoutPlan.exercises)) {
        console.warn('Invalid workout plan or exercises array');
        return [];
      }
      
      return workoutPlan.exercises
        .filter(ex => ex && typeof ex === 'object' && ex.name)
        .map((parsedEx, index) => {
          const exercise = findExerciseByName(parsedEx.name);
          
          // Only include exercises that are found in the database
          if (!exercise) {
            console.warn(`Exercise "${parsedEx.name}" not found in database. Skipping.`);
            return null;
          }

          return {
            exercise,
            sets: Array.from({ length: parsedEx.sets }, (_, setIndex) => ({
              id: generateUUID(),
              setNumber: setIndex + 1,
              targetReps: typeof parsedEx.reps === 'number' ? parsedEx.reps : parseInt(parsedEx.reps.toString()) || 10,
              weight: parsedEx.weight,
              comments: parsedEx.notes || '',
              isPR: false,
              isWarmup: setIndex === 0 && parsedEx.sets > 2,
              isDropset: false,
              isFailure: false
            }))
          };
        })
        .filter((workoutExercise): workoutExercise is WorkoutExercise => workoutExercise !== null); // Remove null entries
    } catch (error) {
      console.error('Error generating workout exercises:', error);
      return [];
    }
  };

  const handleStartWorkout = async () => {
    setIsGenerating(true);
    
    try {
      const workoutExercises = generateWorkoutExercises();
      
      if (workoutExercises.length === 0) {
        console.error('No exercises generated for workout');
        return;
      }
      
      // Use the proper WorkoutContext to start the workout
      await startWorkout(
        workoutExercises.map(we => we.exercise),
        workoutPlan.name,
        workoutExercises
      );
      
      // Navigate to workout page
      navigate('/workout');
      
    } catch (error) {
      console.error('Error starting AI workout:', error);
      // Could show a toast or error message to user here
    } finally {
      setIsGenerating(false);
    }
  };

  // Calculate stats based on matched exercises only with safety checks
  const safeExercises = workoutPlan?.exercises || [];
  const matchedExercises = safeExercises.filter(ex => ex && ex.name && findExerciseByName(ex.name) !== null);
  const totalSets = matchedExercises.reduce((sum, ex) => sum + (ex?.sets || 0), 0) || 0;
  const estimatedDuration = workoutPlan?.duration || totalSets * 3 + 10; // Rough estimate

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="max-w-[280px] bg-white rounded-2xl p-5 border border-gray-200 shadow-sm mt-3 overflow-hidden relative"
    >
      {/* Background accent */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-full -translate-y-8 translate-x-8 opacity-60" />
      
      {/* Header */}
      <div className="relative z-10">
        <div className="flex flex-col items-start justify-between mb-4 gap-2">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-sm">
              <Zap className="text-white" size={18} />
            </div>
            <div>
              <h3 className="font-bold text-lg text-gray-900 leading-tight">
                {generateCoolWorkoutName(workoutPlan?.exercises || [])}
              </h3>
              <p className="text-sm text-gray-500">Custom workout</p>
            </div>
          </div>
          
          <button
            onClick={handleStartWorkout}
            disabled={isGenerating || matchedExercises.length === 0}
            className="flex items-center space-x-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-2.5 rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm font-medium"
          >
            {isGenerating ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                <span className="text-sm">Starting...</span>
              </>
            ) : (
              <>
                <Play size={16} fill="currentColor" />
                <span className="text-sm">Start Workout</span>
              </>
            )}
          </button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="bg-gray-50 rounded-xl px-3 py-2.5 text-center">
            <div className="flex items-center justify-center mb-1">
              <Dumbbell size={16} className="text-indigo-600" />
            </div>
            <div className="text-lg font-bold text-gray-900">{matchedExercises.length}</div>
            <div className="text-xs text-gray-500 font-medium">Exercises</div>
          </div>
          
          <div className="bg-gray-50 rounded-xl px-3 py-2.5 text-center">
            <div className="flex items-center justify-center mb-1">
              <Target size={16} className="text-purple-600" />
            </div>
            <div className="text-lg font-bold text-gray-900">{totalSets}</div>
            <div className="text-xs text-gray-500 font-medium">Total Sets</div>
          </div>
          
          <div className="bg-gray-50 rounded-xl px-3 py-2.5 text-center">
            <div className="flex items-center justify-center mb-1">
              <Timer size={16} className="text-green-600" />
            </div>
            <div className="text-lg font-bold text-gray-900">{estimatedDuration}</div>
            <div className="text-xs text-gray-500 font-medium">Minutes</div>
          </div>
        </div>

        {/* Exercise List */}
        <div className="space-y-2">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-gray-700 flex items-center space-x-2">
              <Check size={14} className="text-green-500" />
              <span>Exercises ({matchedExercises.length})</span>
            </h4>
            {matchedExercises.length < safeExercises.length && (
              <span className="text-xs text-amber-700 bg-amber-50 px-2 py-1 rounded-lg border border-amber-200 font-medium">
                {safeExercises.length - matchedExercises.length} skipped
              </span>
            )}
          </div>
          
          <div className="space-y-1.5 max-h-48 overflow-y-auto scrollbar-thin">
            {matchedExercises.map((exercise, index) => (
              <div key={index} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2.5 hover:bg-gray-100 transition-colors">
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  <div className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 truncate">{exercise.name}</p>
                    {exercise.notes && (
                      <p className="text-xs text-gray-500 truncate">{exercise.notes}</p>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center space-x-3 text-right flex-shrink-0">
                  <div className="text-sm font-semibold text-gray-700">
                    {exercise.sets} × {exercise.reps}
                  </div>
                  {exercise.weight && (
                    <div className="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded-md font-medium">
                      {exercise.weight}lbs
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        {matchedExercises.length > 0 ? (
          <div className="mt-4 pt-3 border-t border-gray-100">
            <p className="text-xs text-gray-500 text-center">
              ✅ All exercises verified from your database • Ready to track
            </p>
          </div>
        ) : (
          <div className="mt-4 pt-3 border-t border-gray-100">
            <p className="text-xs text-amber-600 text-center bg-amber-50 py-2 px-3 rounded-lg">
              ⚠️ No matching exercises found in your database
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
};