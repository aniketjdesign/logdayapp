import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy, X, Medal, History, Plus, Dumbbell, Timer, Award } from 'lucide-react';
import { WorkoutLog } from '../types/workout';
import { useWorkout } from '../context/WorkoutContext';
import { useSettings } from '../context/SettingsContext';
import Lottie from 'lottie-react';
import confettiAnimation from '../assets/confetti.json';
import { motion, AnimatePresence } from 'framer-motion';

interface WorkoutReviewProps {
  workout: WorkoutLog;
  onClose: () => void;
}

export const WorkoutReview: React.FC<WorkoutReviewProps> = ({ workout, onClose }) => {
  const navigate = useNavigate();
  const { clearWorkoutState, searchLogs } = useWorkout();
  const { weightUnit, convertWeight, defaultHomePage } = useSettings();
  const [isAnimationComplete, setIsAnimationComplete] = useState(false);
  const [animationSegment, setAnimationSegment] = useState<[number, number]>([0, 110]);

  // Calculate animation duration based on the JSON data
  const ANIMATION_DURATION = 110; // frames
  const TOTAL_PLAYS = 2;

  useEffect(() => {
    let timeout: NodeJS.Timeout;
    if (!isAnimationComplete) {
      timeout = setTimeout(() => {
        setAnimationSegment([0, ANIMATION_DURATION]);
        setIsAnimationComplete(true);
      }, (ANIMATION_DURATION / 60) * 1000 * TOTAL_PLAYS); // Convert frames to milliseconds
    }
    return () => clearTimeout(timeout);
  }, []);

  const calculateStats = () => {
    let totalWeight = 0;
    let totalSets = 0;
    let totalPRs = 0;
    let totalDistance = 0;
    let totalTime = 0;

    workout.exercises.forEach(({ exercise, sets }) => {
      const isBodyweight = exercise.name.includes('(Bodyweight)');
      const isCardio = exercise.muscleGroup === 'Cardio';
      const isDumbbell = exercise.name.toLowerCase().includes('dumbbell');
      
      // Exceptions to the dumbbell multiplication rule
      const isDumbbellException = 
        exercise.name.includes('Weight Lying Raises') || 
        exercise.name.includes('Sumo Dumbbell Squats');

      sets.forEach(set => {
        if (isCardio) {
          if (set.distance) totalDistance += set.distance;
          if (set.time) {
            const [minutes = 0, seconds = 0] = set.time.split(':').map(Number);
            totalTime += minutes * 60 + seconds;
          }
        } else if (!isBodyweight && set.weight && set.performedReps) {
          // All weights are stored in kgs, so convert if user's preference is lbs
        const weight = weightUnit === 'lbs' ? convertWeight(set.weight, 'kgs', 'lbs') : set.weight;
          const reps = parseInt(set.performedReps) || 0;
          
          // Multiply by 2 for dumbbell exercises (except exceptions)
          if (isDumbbell && !isDumbbellException) {
            totalWeight += weight * reps * 2; // Multiply by 2 for dumbbells (both arms)
          } else {
            totalWeight += weight * reps;
          }
        }
        totalSets++;
        if (set.isPR) totalPRs++;
      });
    });

    return { totalWeight, totalSets, totalPRs, totalDistance, totalTime };
  };

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return `${hrs}h ${mins}m`;
  };

  const getBestSets = () => {
    const bestSets: { exerciseId: string; exerciseName: string; weight: number; reps: number }[] = [];

    workout.exercises.forEach(({ exercise, sets }) => {
      const isBodyweight = exercise.name.includes('(Bodyweight)');
      const isCardio = exercise.muscleGroup === 'Cardio';

      if (!isBodyweight && !isCardio) {
        const bestSet = sets.reduce((best, current) => {
          const currentWeight = current.weight || 0;
          const currentReps = parseInt(current.performedReps || '0');
          const bestWeight = best.weight || 0;
          const bestReps = parseInt(best.performedReps || '0');

          if (currentWeight * currentReps > bestWeight * bestReps) {
            return current;
          }
          return best;
        }, sets[0]);

        if (bestSet && bestSet.weight && bestSet.performedReps) {
          bestSets.push({
            exerciseId: exercise.id,
            exerciseName: exercise.name,
            weight: bestSet.weight,
            reps: parseInt(bestSet.performedReps)
          });
        }
      }
    });

    return bestSets;
  };

  const handleGoToLogs = async () => {
    clearWorkoutState();
    await searchLogs('');
    onClose();
    navigate('/logs');
  };

  const handleStartNew = () => {
    clearWorkoutState();
    onClose();
    // Navigate to the user's default home page instead of always going to '/'
    const homePath = defaultHomePage === 'routines' ? '/routines' : '/';
    navigate(homePath);
  };

  const { totalWeight, totalSets, totalPRs, totalDistance, totalTime } = calculateStats();
  const duration = Math.floor((new Date(workout.endTime).getTime() - new Date(workout.startTime).getTime()) / 1000);
  const bestSets = getBestSets();

  // Generate fun weight comparison message
  const getWeightComparisonMessage = () => {
    if (totalWeight <= 0) return "Great job crushing your workout! 💪";
    
    // Group comparisons by threshold for more variety
    const comparisonsByThreshold = {
      50: [
        { item: "cats", weight: 4, emoji: "🐱" },
        { item: "bowling balls", weight: 7, emoji: "🎳" },
        { item: "gallons of milk", weight: 4, emoji: "🥛" },
        { item: "toasters", weight: 3, emoji: "🍞" },
        { item: "laptops", weight: 2, emoji: "💻" }
      ],
      100: [
        { item: "dogs", weight: 20, emoji: "🐕" },
        { item: "microwave ovens", weight: 25, emoji: "🍚" },
        { item: "car tires", weight: 10, emoji: "🛢️" },
        { item: "toddlers", weight: 15, emoji: "👶" },
        { item: "large watermelons", weight: 12, emoji: "🍉" }
      ],
      500: [
        { item: "pandas", weight: 100, emoji: "🐼" },
        { item: "washing machines", weight: 80, emoji: "🧺" },
        { item: "refrigerators", weight: 120, emoji: "🧊" },
        { item: "kangaroos", weight: 90, emoji: "🦘" },
        { item: "adult lions", weight: 190, emoji: "🦁" }
      ],
      1000: [
        { item: "grand pianos", weight: 300, emoji: "🎹" },
        { item: "grizzly bears", weight: 270, emoji: "🐻" },
        { item: "vending machines", weight: 400, emoji: "🍟" },
        { item: "motorcycles", weight: 180, emoji: "🏍️" },
        { item: "gorillas", weight: 180, emoji: "🦍" }
      ],
      2000: [
        { item: "cars", weight: 1500, emoji: "🚗" },
        { item: "grand pianos", weight: 300, emoji: "🎹" },
        { item: "hippos", weight: 1500, emoji: "🦛" },
        { item: "ATMs", weight: 250, emoji: "🏧" },
        { item: "smart cars", weight: 800, emoji: "🚘" }
      ],
      5000: [
        { item: "elephants", weight: 4000, emoji: "🐘" },
        { item: "SUVs", weight: 2000, emoji: "🚙" },
        { item: "rhinos", weight: 2200, emoji: "🦏" },
        { item: "giraffes", weight: 1600, emoji: "🦒" },
        { item: "small boats", weight: 1800, emoji: "🚣" }
      ],
      10000: [
        { item: "school buses", weight: 10000, emoji: "🚌" },
        { item: "delivery trucks", weight: 7500, emoji: "🛻" },
        { item: "T-Rex dinosaurs", weight: 8000, emoji: "🦖" },
        { item: "large sailboats", weight: 8000, emoji: "⛵" },
        { item: "ambulances", weight: 5500, emoji: "🚑" }
      ],
      20000: [
        { item: "blue whales", weight: 150000, emoji: "🐋" },
        { item: "fire trucks", weight: 19000, emoji: "🚒" },
        { item: "shipping containers", weight: 25000, emoji: "📬" },
        { item: "RVs", weight: 14000, emoji: "🚧" },
        { item: "bulldozers", weight: 18000, emoji: "🚜" }
      ],
      Infinity: [
        { item: "airplanes", weight: 80000, emoji: "✈️" },
        { item: "space shuttles", weight: 2000000, emoji: "🚀" },
        { item: "cruise ships", weight: 200000, emoji: "🚢" },
        { item: "Eiffel Towers", weight: 10000000, emoji: "🏰" },
        { item: "Statue of Liberties", weight: 225000, emoji: "🗽" }
      ]
    };
    
    // Find the appropriate threshold
    let threshold: number | 'Infinity' = Infinity;
    const thresholds = Object.keys(comparisonsByThreshold)
      .map(t => t === 'Infinity' ? Infinity : Number(t))
      .sort((a, b) => a === Infinity ? 1 : b === Infinity ? -1 : a - b);
    
    for (const t of thresholds) {
      if (totalWeight < t) {
        threshold = t === Infinity ? 'Infinity' : t;
        break;
      }
    }
    
    // Convert threshold to string key for indexing
    const thresholdKey = threshold === Infinity ? 'Infinity' : threshold.toString();
    
    // Get a random comparison from the appropriate threshold group
    const comparisonsForThreshold = comparisonsByThreshold[thresholdKey as keyof typeof comparisonsByThreshold];
    const randomIndex = Math.floor(Math.random() * comparisonsForThreshold.length);
    const comparison = comparisonsForThreshold[randomIndex];
    
    const count = Math.max(1, Math.round(totalWeight / comparison.weight));
    const pluralS = count === 1 ? '' : 's';
    
    return `You lifted the equivalent of ${count} ${comparison.item}${pluralS}! ${comparison.emoji}`;
  };
  
  const weightComparisonMessage = getWeightComparisonMessage();

  return (
    <AnimatePresence>
      <motion.div 
        className="fixed inset-0 flex items-center justify-center p-4 z-50"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div 
          className="fixed inset-0 bg-black z-40"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.6 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        />
        
        <div className="fixed inset-0 pointer-events-none z-[100]">
          <div className="absolute inset-0 overflow-hidden">
            <Lottie
              animationData={confettiAnimation}
              loop={false}
              autoplay={true}
              segments={[animationSegment]}
              style={{
                position: 'absolute',
                width: '100%',
                height: '100%',
                top: '-10%',
                transform: 'scale(2)',
                pointerEvents: 'none'
              }}
            />
          </div>
        </div>

        <motion.div 
          className="bg-white rounded-xl max-w-2xl w-full my-8 max-h-[85vh] flex flex-col relative z-50 overflow-hidden"
          initial={{ opacity: 0, scale: 0.9, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 30 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
        >
          {/* 1. Header - Workout Completed */}
          <motion.div 
            className="p-6 border-b flex-shrink-0 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-t-xl"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <div className="flex justify-between items-start">
              <motion.h2 
                className="text-xl font-semibold flex items-center"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3, duration: 0.5 }}
              >
                <Trophy className="mr-2" /> Workout Completed
              </motion.h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-blue-500 rounded-full transition-colors bg-blue-600/30 backdrop-blur-sm"
              >
                <X size={16} className="text-white" />
              </button>
            </div>
          </motion.div>

          <div className="flex-1 overflow-y-auto p-4">
            {/* 2. Total Volume - Full row with weight comparison message */}
            {totalWeight > 0 && (
              <motion.div 
                className="w-full mb-3 bg-purple-50 border border-purple-100 p-3 rounded-2xl shadow-sm overflow-hidden relative"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.4 }}
                whileHover={{ scale: 1.01, transition: { duration: 0.2 } }}
              >
                <div className="flex flex-col items-start justify-center">
                  <div className="flex items-center mb-1">
                    <div className="text-purple-600 font-semibold text-sm">💪 Total Volume</div>
                  </div>
                  <div className="text-3xl font-semibold mb-3">
                    {totalWeight.toLocaleString()} {weightUnit}
                  </div>
                  <motion.div 
                    className="bg-purple-100 px-4 py-2 rounded-xl text-purple-700 font-medium mt-1"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.4, duration: 0.3, type: "spring" }}
                  >
                    {weightComparisonMessage}
                  </motion.div>
                </div>
              </motion.div>
            )}

            {/* 3. Second Row: Duration, Sets, PRs */}
            <motion.div 
              className="grid grid-cols-3 gap-4 w-full mb-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.3, staggerChildren: 0.1 }}
            >
              <motion.div 
                className="bg-blue-50 border border-blue-100 p-2 rounded-xl shadow-sm overflow-hidden relative"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.4 }}
                whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
              >
                <div className="flex">
                  <div className="text-blue-600 font-semibold text-sm">⏰ <br/> Duration</div>
                </div>
                <div className="text-xl font-semibold mt-1 pl-1">{formatTime(duration)}</div>
              </motion.div>

              <motion.div 
                className="bg-green-50 border border-green-100 p-2 rounded-xl shadow-sm overflow-hidden relative"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.4 }}
                whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
              >
                <div className="flex">
                  
                  <div className="text-green-600 font-semibold text-sm">⚡️<br/>  Sets</div>
                </div>
                <div className="text-xl font-semibold mt-1 pl-1">{totalSets}</div>
              </motion.div>

              <motion.div 
                className="bg-yellow-50 border border-yellow-100 p-2 rounded-xl shadow-sm overflow-hidden relative"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.4 }}
                whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
              >
                <div className="flex">
                  <div className="text-yellow-600 font-semibold text-sm">🏆<br/> PRs</div>
                </div>
                <div className="text-xl font-semibold mt-1 pl-1">{totalPRs}</div>
              </motion.div>

              {/* Show these conditionally if they exist */}
              {totalDistance > 0 && (
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="text-green-600 font-semibold text-center">Distance</div>
                  <div className="text-xl font-semibold text-center">{totalDistance.toLocaleString()} m</div>
                </div>
              )}
              {totalTime > 0 && (
                <div className="bg-indigo-50 p-4 rounded-lg">
                  <div className="text-indigo-600 font-semibold text-center">Time</div>
                  <div className="text-xl font-semibold text-center">{formatTime(totalTime)}</div>
                </div>
              )}
            </motion.div>

            {/* 4. Best Sets */}
            {bestSets.length > 0 && (
              <motion.div 
                className="mb-8"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.5 }}
              >
                <h3 className="text-sm font-semibold mb-2 flex items-center">
                  🥇 Best Sets
                </h3>
                <div className="space-y-3">
                  {bestSets.map((set, index) => (
                    <motion.div
                      key={set.exerciseId}
                      className="bg-gray-50 p-2 rounded-xl flex justify-between items-center shadow-sm border border-gray-100"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.5 + (index * 0.1), duration: 0.4 }}
                      whileHover={{ scale: 1.01, transition: { duration: 0.2 } }}
                    >
                      <div>
                        <div className="font-medium text-sm">{set.exerciseName}</div>
                        <div className="text-xs text-gray-600">
                          {set.weight} {weightUnit} × {set.reps} reps
                        </div>
                      </div>
                      <div className="bg-amber-50 h-8 w-8 rounded-xl flex items-center justify-center">
                        <span className="text-amber-700 font-semibold text-xs">#{index + 1}</span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
        </div>

        <motion.div 
          className="p-4 border-t flex-shrink-0 bg-gray-50"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.4 }}
        >
          <div className="grid grid-cols-2 gap-3">
            <motion.button
              onClick={handleGoToLogs}
              className="flex h-10 items-center justify-center px-2 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              <History size={16} className="mr-2" />
              View Log
            </motion.button>
            <motion.button
              onClick={handleStartNew}
              className="flex h-10 items-center justify-center px-2 py-1 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors shadow-sm"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              <Plus size={16} className="mr-2" />
              Start New
            </motion.button>
          </div>
        </motion.div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};