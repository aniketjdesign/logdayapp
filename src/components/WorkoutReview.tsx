import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy, X, Medal, ClipboardList, Plus } from 'lucide-react';
import { WorkoutLog } from '../types/workout';
import { useWorkout } from '../context/WorkoutContext';
import { useSettings } from '../context/SettingsContext';
import Lottie from 'lottie-react';
import confettiAnimation from '../assets/confetti.json';

interface WorkoutReviewProps {
  workout: WorkoutLog;
  onClose: () => void;
}

export const WorkoutReview: React.FC<WorkoutReviewProps> = ({ workout, onClose }) => {
  const navigate = useNavigate();
  const { clearWorkoutState, searchLogs } = useWorkout();
  const { weightUnit, convertWeight } = useSettings();
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

      sets.forEach(set => {
        if (isCardio) {
          if (set.distance) totalDistance += set.distance;
          if (set.time) {
            const [minutes = 0, seconds = 0] = set.time.split(':').map(Number);
            totalTime += minutes * 60 + seconds;
          }
        } else if (!isBodyweight && set.weight && set.performedReps) {
          const weight = weightUnit === 'lb' ? convertWeight(set.weight, 'kg', 'lb') : set.weight;
          totalWeight += weight * (parseInt(set.performedReps) || 0);
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
    // Trigger a refresh of the logs before navigating
    await searchLogs('');
    onClose();
    navigate('/logs');
  };

  const handleStartNew = () => {
    clearWorkoutState();
    onClose();
    navigate('/');
  };

  const { totalWeight, totalSets, totalPRs, totalDistance, totalTime } = calculateStats();
  const duration = Math.floor((new Date(workout.endTime).getTime() - new Date(workout.startTime).getTime()) / 1000);
  const bestSets = getBestSets();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center p-4 z-50">
      {/* Rest of the component remains unchanged */}
    </div>
  );
};