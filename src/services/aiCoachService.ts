import { supabaseService } from './supabaseService';
import { WorkoutLog, Exercise, RoutineExercise, RoutineSet } from '../types/workout';

/**
 * Service for AI Coach functionality
 * Provides methods to fetch and format user workout data for the AI
 */
export const aiCoachService = {
  /**
   * Get a summary of the user's complete workout history
   * @returns A formatted string with workout history
   */
  async getUserWorkoutSummary(): Promise<string> {
    try {
      // Get all workout logs (not just recent ones)
      const { data: workoutLogs, error } = await supabaseService.getAllWorkoutLogs();
      
      if (error || !workoutLogs.length) {
        return "No workout history found.";
      }

      // Format workout logs into a readable summary
      const summary = this.formatWorkoutSummary(workoutLogs);
      return summary;
    } catch (error) {
      console.error('Error getting user workout summary:', error);
      return "Error retrieving workout history.";
    }
  },

  /**
   * Format workout logs into a readable summary
   * @param workoutLogs Array of workout logs
   * @returns Formatted summary string
   */
  formatWorkoutSummary(workoutLogs: WorkoutLog[]): string {
    if (!workoutLogs.length) return "No workout history found.";

    // Sort logs by date (newest first)
    const sortedLogs = [...workoutLogs].sort((a, b) => 
      new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
    );
    
    // Get total number of workouts
    const totalWorkouts = sortedLogs.length;
    
    // Get most recent workout
    const mostRecent = sortedLogs[0];
    const mostRecentDate = new Date(mostRecent.startTime).toLocaleDateString();
    
    // Get workout frequency (workouts per week over the last 4 weeks)
    const fourWeeksAgo = new Date();
    fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);
    
    const recentWorkouts = sortedLogs.filter(log => 
      new Date(log.startTime) >= fourWeeksAgo
    );
    
    const workoutsPerWeek = recentWorkouts.length / 4;
    
    // Calculate most common exercises
    const exerciseCounts: Record<string, number> = {};
    sortedLogs.forEach(log => {
      log.exercises.forEach(workoutExercise => {
        const name = workoutExercise.exercise.name;
        exerciseCounts[name] = (exerciseCounts[name] || 0) + 1;
      });
    });
    
    const sortedExercises = Object.entries(exerciseCounts)
      .sort(([, countA], [, countB]) => countB - countA)
      .slice(0, 5);
    
    // Format the summary
    let summary = `Workout Summary:\n`;
    summary += `- Total workouts logged: ${totalWorkouts}\n`;
    summary += `- Most recent workout: ${mostRecentDate} (${mostRecent.name})\n`;
    summary += `- Average workouts per week: ${workoutsPerWeek.toFixed(1)}\n`;
    
    if (sortedExercises.length) {
      summary += `- Most frequent exercises:\n`;
      sortedExercises.forEach(([name, count]) => {
        summary += `  • ${name} (${count} times)\n`;
      });
    }
    
    // Add details of the most recent workout
    summary += `\nMost recent workout details (${mostRecent.name}):\n`;
    mostRecent.exercises.forEach(workoutExercise => {
      summary += `- ${workoutExercise.exercise.name}: `;
      if (workoutExercise.sets.length) {
        const setDetails = workoutExercise.sets.map(set => {
          let details = '';
          if (set.weight) details += `${set.weight} lbs`;
          if (set.performedReps) details += details ? ` x ${set.performedReps}` : `${set.performedReps} reps`;
          return details || 'completed';
        }).join(', ');
        summary += setDetails;
      } else {
        summary += 'no sets recorded';
      }
      summary += '\n';
    });
    
    return summary;
  },

  /**
   * Get workout trends and insights
   * @returns Analysis of workout trends
   */
  async getWorkoutTrends(): Promise<string> {
    try {
      const { data: workoutLogs, error } = await supabaseService.getAllWorkoutLogs();
      
      if (error || !workoutLogs.length) {
        return "No workout data available for trend analysis.";
      }

      if (workoutLogs.length < 3) {
        return "Not enough workout data to analyze trends. Log more workouts to see insights.";
      }

      // Sort logs by date (oldest first for trend analysis)
      const sortedLogs = [...workoutLogs].sort((a, b) => 
        new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
      );
      
      // Calculate average workout duration trend
      const durationTrend = this.calculateDurationTrend(sortedLogs);
      
      // Calculate exercise progression for common exercises
      const progressionInsights = this.calculateExerciseProgression(sortedLogs);
      
      // Format the trends
      let trends = `Workout Trends:\n`;
      trends += durationTrend + '\n\n';
      trends += progressionInsights;
      
      return trends;
    } catch (error) {
      console.error('Error getting workout trends:', error);
      return "Error analyzing workout trends.";
    }
  },

  /**
   * Calculate workout duration trend
   */
  calculateDurationTrend(workoutLogs: WorkoutLog[]): string {
    if (workoutLogs.length < 3) return "Not enough workouts to analyze duration trends.";
    
    // Split logs into first half and second half
    const midpoint = Math.floor(workoutLogs.length / 2);
    const firstHalf = workoutLogs.slice(0, midpoint);
    const secondHalf = workoutLogs.slice(midpoint);
    
    // Calculate average durations
    const avgDurationFirst = firstHalf.reduce((sum, log) => sum + (log.duration || 0), 0) / firstHalf.length;
    const avgDurationSecond = secondHalf.reduce((sum, log) => sum + (log.duration || 0), 0) / secondHalf.length;
    
    // Format duration in minutes
    const formatDuration = (seconds: number) => (seconds / 60).toFixed(1);
    
    // Determine trend
    const durationDiff = avgDurationSecond - avgDurationFirst;
    let trend;
    
    if (Math.abs(durationDiff) < 60) { // Less than 1 minute difference
      trend = "Your workout duration has remained consistent";
    } else if (durationDiff > 0) {
      trend = `Your workouts are getting longer (increased by ${formatDuration(durationDiff)} minutes on average)`;
    } else {
      trend = `Your workouts are getting shorter (decreased by ${formatDuration(Math.abs(durationDiff))} minutes on average)`;
    }
    
    return trend;
  },

  /**
   * Calculate progression for common exercises
   */
  calculateExerciseProgression(workoutLogs: WorkoutLog[]): string {
    // Find exercises that appear in multiple workouts
    const exerciseOccurrences: Record<string, {dates: Date[], weights: number[]}> = {};
    
    workoutLogs.forEach(log => {
      const date = new Date(log.startTime);
      
      log.exercises.forEach(workoutExercise => {
        const name = workoutExercise.exercise.name;
        
        if (!exerciseOccurrences[name]) {
          exerciseOccurrences[name] = {dates: [], weights: []};
        }
        
        // Get max weight for this exercise in this workout
        let maxWeight = 0;
        workoutExercise.sets.forEach(set => {
          if (set.weight && set.weight > maxWeight) {
            maxWeight = set.weight;
          }
        });
        
        if (maxWeight > 0) {
          exerciseOccurrences[name].dates.push(date);
          exerciseOccurrences[name].weights.push(maxWeight);
        }
      });
    });
    
    // Filter to exercises with at least 3 occurrences
    const frequentExercises = Object.entries(exerciseOccurrences)
      .filter(([, data]) => data.dates.length >= 3)
      .sort(([, dataA], [, dataB]) => dataB.dates.length - dataA.dates.length)
      .slice(0, 3); // Top 3 most frequent
    
    if (frequentExercises.length === 0) {
      return "Not enough consistent exercise data to analyze progression.";
    }
    
    // Analyze progression
    let progressionText = "Exercise Progression:\n";
    
    frequentExercises.forEach(([name, data]) => {
      // Calculate if weight is trending up or down
      const firstWeight = data.weights[0];
      const lastWeight = data.weights[data.weights.length - 1];
      const weightDiff = lastWeight - firstWeight;
      
      let trend;
      if (weightDiff > 0) {
        const percentIncrease = ((weightDiff / firstWeight) * 100).toFixed(1);
        trend = `increasing (${percentIncrease}% heavier)`;
      } else if (weightDiff < 0) {
        const percentDecrease = ((Math.abs(weightDiff) / firstWeight) * 100).toFixed(1);
        trend = `decreasing (${percentDecrease}% lighter)`;
      } else {
        trend = "staying consistent";
      }
      
      progressionText += `- ${name}: Weight is ${trend} over ${data.dates.length} workouts\n`;
    });
    
    return progressionText;
  },

  /**
   * Get user routines
   * @returns A formatted string with user's routines
   */
  async getUserRoutines(): Promise<string> {
    try {
      const { data: routines, error } = await supabaseService.getRoutines();
      
      if (error || !routines.length) {
        return "No routines found.";
      }

      // Format routines into a readable summary
      let summary = `User Routines (${routines.length} total):\n`;
      
      routines.forEach((routine, index) => {
        summary += `\n${index + 1}. ${routine.name}`;
        if (routine.description) summary += ` - ${routine.description}`;
        summary += `\n   Exercises: ${routine.total_exercises || routine.exercises.length}`;
        summary += `\n   Total Sets: ${routine.total_sets || routine.exercises.reduce((total: number, ex: RoutineExercise) => total + ex.sets.length, 0)}`;
        
        // Add exercise details
        if (routine.exercises && routine.exercises.length) {
          summary += `\n   Exercise List:`;
          routine.exercises.forEach((ex: RoutineExercise) => {
            const setsInfo = ex.sets.map((set: RoutineSet) => {
              let info = '';
              if (set.targetReps) info += `${set.targetReps} reps`;
              if (set.weight) info += info ? ` at ${set.weight} lbs` : `${set.weight} lbs`;
              return info || '1 set';
            }).join(', ');
            
            summary += `\n   • ${ex.exercise.name}: ${setsInfo}`;
          });
        }
      });
      
      return summary;
    } catch (error) {
      console.error('Error getting user routines:', error);
      return "Error retrieving routines.";
    }
  },
  
  /**
   * Get user settings
   * @returns A formatted string with user's settings
   */
  async getUserSettings(): Promise<string> {
    try {
      const { weightUnit, disableRestTimer, defaultHomePage, error } = await supabaseService.getUserSettings();
      
      if (error) {
        return "Error retrieving user settings.";
      }

      let settings = "User Settings:\n";
      settings += `- Weight Unit: ${weightUnit}\n`;
      settings += `- Rest Timer: ${disableRestTimer ? 'Disabled' : 'Enabled'}\n`;
      settings += `- Default Home Page: ${defaultHomePage}`;
      
      return settings;
    } catch (error) {
      console.error('Error getting user settings:', error);
      return "Error retrieving user settings.";
    }
  },
  
  /**
   * Get user exercises (both default and custom)
   * @returns A formatted string with user's exercises
   */
  async getUserExercises(): Promise<string> {
    try {
      const { data: exercises, error } = await supabaseService.getAllExercises();
      
      if (error || !exercises.length) {
        return "No exercises found.";
      }

      // Group exercises by muscle group
      const exercisesByMuscle: Record<string, Exercise[]> = {};
      exercises.forEach((exercise: Exercise) => {
        const muscleGroup = exercise.muscleGroup;
        if (!exercisesByMuscle[muscleGroup]) {
          exercisesByMuscle[muscleGroup] = [];
        }
        exercisesByMuscle[muscleGroup].push(exercise);
      });
      
      // Format exercises into a readable summary
      let summary = `User Exercises (${exercises.length} total):\n`;
      
      Object.entries(exercisesByMuscle).forEach(([muscleGroup, exs]) => {
        summary += `\n${muscleGroup} (${exs.length}):\n`;
        exs.forEach((ex: Exercise) => {
          summary += `- ${ex.name}`;
          if (ex.category) summary += ` (${ex.category})`;
          summary += '\n';
        });
      });
      
      // Add information about recently used exercises
      const recentExercises = await supabaseService.getRecentExercises(5);
      if (recentExercises && recentExercises.length) {
        summary += "\nRecently Used Exercises:\n";
        recentExercises.forEach((ex: Exercise) => {
          summary += `- ${ex.name} (${ex.muscleGroup})\n`;
        });
      }
      
      return summary;
    } catch (error) {
      console.error('Error getting user exercises:', error);
      return "Error retrieving exercises.";
    }
  }
};
