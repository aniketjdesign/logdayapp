import { MuscleGroup } from '../types/workout';

export interface ParsedWorkoutPlan {
  name: string;
  description?: string;
  duration?: number;
  exercises: ParsedExercise[];
}

export interface ParsedExercise {
  name: string;
  muscleGroup?: MuscleGroup;
  sets: number;
  reps: number | string;
  weight?: number;
  notes?: string;
}

const muscleGroupMap: { [key: string]: MuscleGroup } = {
  'chest': 'Chest',
  'back': 'Back',
  'shoulders': 'Shoulders',
  'shoulder': 'Shoulders',
  'quads': 'Quads',
  'quadriceps': 'Quads',
  'hamstrings': 'Hamstrings',
  'hamstring': 'Hamstrings',
  'triceps': 'Triceps',
  'tricep': 'Triceps',
  'biceps': 'Biceps',
  'bicep': 'Biceps',
  'glutes': 'Glutes',
  'glute': 'Glutes',
  'calves': 'Calves',
  'calf': 'Calves',
  'core': 'Core',
  'abs': 'Core',
  'abdominals': 'Core',
  'cardio': 'Cardio',
  'forearms': 'Forearms',
  'forearm': 'Forearms',
  'legs': 'Quads', // Default to quads for general "legs"
  'arms': 'Biceps' // Default to biceps for general "arms"
};

const workoutKeywords = [
  'workout', 'routine', 'session', 'exercise', 'training',
  'here\'s a', 'try this', 'suggested workout', 'workout plan',
  'training session', 'exercise routine', 'recommend', 'suggestion'
];

const exercisePatterns = [
  // Pattern: Exercise Name - Sets x Reps (optional weight)
  /(\d+)\s*(?:sets?\s*(?:of|x|\×))?\s*([^-\n]+?)\s*-?\s*(\d+)?\s*(?:reps?|repetitions?)\s*(?:@|at|with)?\s*(\d+)?\s*(?:lbs?|pounds?|kg|kilograms?)?\s*(?:[-–—]\s*(.+?))?(?:\n|$)/gi,
  
  // Pattern: Exercise Name: Sets x Reps
  /([^:\n]+?):\s*(\d+)\s*(?:sets?\s*)?(?:x|\×|of)\s*(\d+)\s*(?:reps?)?(?:\s*@?\s*(\d+)\s*(?:lbs?|kg)?)?\s*(?:[-–—]\s*(.+?))?(?:\n|$)/gi,
  
  // Pattern: Sets x Reps Exercise Name
  /(\d+)\s*(?:x|\×)\s*(\d+)\s+([^-\n@]+?)(?:\s*@\s*(\d+)\s*(?:lbs?|kg)?)?\s*(?:[-–—]\s*(.+?))?(?:\n|$)/gi,
  
  // Pattern: Exercise Name (Sets sets, Reps reps)
  /([^(\n]+?)\s*\(\s*(\d+)\s*sets?,?\s*(\d+)\s*reps?\s*(?:,?\s*(\d+)\s*(?:lbs?|kg)?)?\s*\)\s*(?:[-–—]\s*(.+?))?(?:\n|$)/gi,
  
  // Pattern: Numbered list format
  /\d+\.\s*([^-\n]+?)\s*-?\s*(\d+)\s*(?:sets?\s*(?:of|x|\×))?\s*(\d+)\s*(?:reps?|repetitions?)\s*(?:@|at|with)?\s*(\d+)?\s*(?:lbs?|pounds?|kg|kilograms?)?\s*(?:[-–—]\s*(.+?))?(?:\n|$)/gi
];

export function parseWorkoutFromText(text: string): ParsedWorkoutPlan | null {
  try {
    // Safety check for input
    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return null;
    }
    
    // Check if text contains workout-related keywords
    const hasWorkoutKeywords = workoutKeywords.some(keyword => {
      if (!keyword || typeof keyword !== 'string') return false;
      return text.toLowerCase().includes(keyword.toLowerCase());
    });

    if (!hasWorkoutKeywords) {
      return null;
    }

  const exercises: ParsedExercise[] = [];
  const processedExercises = new Set<string>();

  // Try each pattern to extract exercises
  for (const pattern of exercisePatterns) {
    pattern.lastIndex = 0; // Reset regex
    let match;
    
    while ((match = pattern.exec(text)) !== null) {
      let exerciseName: string;
      let sets: number;
      let reps: number | string;
      let weight: number | undefined;
      let notes: string | undefined;

      // Handle different pattern matches based on capture groups
      if (pattern.source.includes('([^:\\n]+?):')) {
        // Pattern: Exercise Name: Sets x Reps
        if (match.length < 6) continue;
        [, exerciseName, sets, reps, weight, notes] = match;
        sets = parseInt(String(sets || '0'));
        reps = parseInt(String(reps || '0'));
      } else if (pattern.source.includes('(\\d+)\\s*(?:x|\\×)\\s*(\\d+)\\s+([^-\\n@]+?)')) {
        // Pattern: Sets x Reps Exercise Name
        if (match.length < 6) continue;
        [, sets, reps, exerciseName, weight, notes] = match;
        sets = parseInt(String(sets || '0'));
        reps = parseInt(String(reps || '0'));
      } else if (pattern.source.includes('([^\\(\\n]+?)\\s*\\(')) {
        // Pattern: Exercise Name (Sets sets, Reps reps)
        if (match.length < 6) continue;
        [, exerciseName, sets, reps, weight, notes] = match;
        sets = parseInt(String(sets || '0'));
        reps = parseInt(String(reps || '0'));
      } else {
        // Default pattern: Exercise Name - Sets x Reps
        if (match.length < 6) continue;
        [, sets, exerciseName, reps, weight, notes] = match;
        sets = parseInt(String(sets || '0'));
        reps = reps ? parseInt(String(reps)) : parseInt(String(match[3] || '10')) || 10;
      }
      
      // Safety checks for extracted values
      if (!exerciseName || typeof exerciseName !== 'string') {
        continue;
      }

      // Clean up exercise name with safety checks
      try {
        exerciseName = (exerciseName || '').toString().trim()
          .replace(/^[-•*]\s*/, '') // Remove bullet points
          .replace(/^\d+\.\s*/, '') // Remove numbering
          .replace(/[""]/g, '"') // Normalize quotes
          .trim();
      } catch (e) {
        console.warn('Error cleaning exercise name:', e);
        continue;
      }

      // Skip if exercise name is too short or already processed
      if (exerciseName.length < 3 || processedExercises.has(exerciseName.toLowerCase())) {
        continue;
      }

      // Parse weight if present with safety check
      const parsedWeight = weight && typeof weight === 'string' ? parseInt(weight) : undefined;

      // Clean up notes with safety check
      const cleanNotes = notes && typeof notes === 'string' ? notes.trim().replace(/[""]/g, '"').trim() : undefined;

      // Determine muscle group from exercise name or notes with safety checks
      let muscleGroup: MuscleGroup | undefined;
      try {
        const searchText = `${exerciseName || ''} ${cleanNotes || ''}`.toLowerCase();
        for (const [keyword, group] of Object.entries(muscleGroupMap)) {
          if (keyword && typeof keyword === 'string' && searchText.includes(keyword)) {
            muscleGroup = group;
            break;
          }
        }
      } catch (e) {
        console.warn('Error determining muscle group:', e);
      }

      exercises.push({
        name: exerciseName,
        muscleGroup,
        sets: Math.max(1, sets), // Ensure at least 1 set
        reps: reps || 10, // Default to 10 reps if not specified
        weight: parsedWeight,
        notes: cleanNotes
      });

      processedExercises.add(exerciseName.toLowerCase());
    }
  }

  // If no exercises found with patterns, try simpler extraction
  if (exercises.length === 0) {
    const lines = text.split('\n');
    for (const line of lines) {
      const trimmedLine = line.trim();
      
      // Skip empty lines or lines that don't look like exercises
      if (!trimmedLine || trimmedLine.length < 5) continue;
      
      // Look for lines that mention sets/reps
      const setsRepsMatch = trimmedLine.match(/(\d+)\s*(?:sets?|x|×)\s*(\d+)/i);
      if (setsRepsMatch) {
        const exerciseName = trimmedLine
          .replace(setsRepsMatch[0], '')
          .replace(/^[-•*\d.]\s*/, '')
          .trim();
        
        if (exerciseName.length >= 3 && !processedExercises.has(exerciseName.toLowerCase())) {
          exercises.push({
            name: exerciseName,
            sets: parseInt(setsRepsMatch[1]),
            reps: parseInt(setsRepsMatch[2])
          });
          processedExercises.add(exerciseName.toLowerCase());
        }
      }
    }
  }

  // Return null if no exercises found
  if (exercises.length === 0) {
    return null;
  }

  // Generate workout name
  let workoutName = 'AI Suggested Workout';
  const nameMatch = text.match(/(?:workout|routine|session|training)(?:\s+name)?[:\s]*([^\n]+)/i);
  if (nameMatch && nameMatch[1].trim().length > 0) {
    workoutName = nameMatch[1].trim().replace(/[""]/g, '"');
  } else {
    // Generate name based on muscle groups with safety checks
    const uniqueMuscleGroups = [...new Set(exercises
      .filter(ex => ex && typeof ex === 'object')
      .map(ex => ex.muscleGroup)
      .filter(group => group && typeof group === 'string')
    )];
    
    if (uniqueMuscleGroups.length > 0) {
      if (uniqueMuscleGroups.length === 1) {
        workoutName = `${uniqueMuscleGroups[0]} Workout`;
      } else if (uniqueMuscleGroups.length === 2) {
        workoutName = `${uniqueMuscleGroups.join(' & ')} Workout`;
      } else {
        workoutName = 'Full Body Workout';
      }
    }
  }

  // Extract duration if mentioned
  const durationMatch = text.match(/(?:duration|time|takes?|lasts?)[:\s]*(\d+)\s*(?:min|minutes?)/i);
  const duration = durationMatch ? parseInt(durationMatch[1]) : undefined;

    return {
      name: workoutName,
      description: `AI-generated workout with ${exercises.length} exercises`,
      duration,
      exercises
    };
  } catch (error) {
    console.error('Error parsing workout from text:', error);
    return null;
  }
}

export function isWorkoutSuggestion(text: string): boolean {
  try {
    return parseWorkoutFromText(text) !== null;
  } catch (error) {
    console.error('Error checking if text is workout suggestion:', error);
    return false;
  }
}