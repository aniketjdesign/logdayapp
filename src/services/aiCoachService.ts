import { supabase } from '../config/supabase';
import { exercises } from '../data/exercises';
import { exerciseService } from './exerciseService';

// AI API configuration
const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY || '';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  conversation_id: string;
}

export interface WorkoutAnalysis {
  insights: string[];
  suggestions: string[];
  progressTrend: 'improving' | 'plateauing' | 'declining';
  focusAreas: string[];
}

export interface UserContext {
  fatigue_level?: number;
  available_time?: number;
  goals?: string[];
  recent_workouts?: any[];
}

class AICoachService {
  private systemPrompt = `You are an expert AI fitness coach for Logday, a workout tracking app. Your role is to:

1. Analyze workout logs and provide personalized insights
2. Answer questions about exercise form and technique
3. Suggest improvements based on workout history
4. Help users optimize their training
5. Create custom workout routines when requested

Guidelines:
- Be encouraging and supportive
- Provide specific, actionable advice
- Reference the user's actual workout data when possible
- Keep responses concise but informative
- Focus on progressive overload, proper form, and consistency
- Consider user's fatigue level and available time

When creating workout routines, use the latest research on hypertrophy and muscle building to create workout routines that are effective and safe.

When creating workout routines, format them clearly with specific formats that can be parsed:
- Format: Exercise Name - Sets x Reps @ Weight
- Or: Exercise Name: Sets x Reps  
- Or: Sets x Reps Exercise Name

CRITICAL REQUIREMENT: You MUST ONLY suggest exercises that are listed in the provided exercise database. DO NOT suggest any exercise that is not explicitly listed. If you cannot find a suitable exercise from the database for a specific muscle group, skip that exercise rather than suggesting something not in the database. The user can only track exercises that exist in their app's database.

When users ask for workouts, create complete, structured routines they can immediately start training with using ONLY exercises from the provided database.

Always maintain a friendly, knowledgeable tone like a personal trainer would.`;

  async sendMessage(
    message: string, 
    conversationId: string, 
    userId: string,
    context?: UserContext
  ): Promise<ChatMessage> {
    try {
      // Get conversation history
      const history = await this.getConversationHistory(conversationId);
      
      // Get user's recent workout data for context
      const workoutData = await this.getUserWorkoutContext(userId);
      
      // Get available exercises for context
      const availableExercises = await this.getAvailableExercises(userId);
      
      // Build context-aware prompt
      const contextPrompt = this.buildContextPrompt(context, workoutData, availableExercises);
      
      // Prepare messages for AI
      const messages = [
        { role: 'system', content: this.systemPrompt + contextPrompt },
        ...history.map(msg => ({ role: msg.role, content: msg.content })),
        { role: 'user', content: message }
      ];

      // Get AI response using fetch (replace with your preferred AI service)
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: messages,
          max_tokens: 500,
          temperature: 0.7,
        }),
      });

      const data = await response.json();

      const aiResponse = data.choices?.[0]?.message?.content || 'Sorry, I had trouble processing that. Can you try again?';

      // Save user message
      await this.saveMessage({
        conversation_id: conversationId,
        role: 'user',
        content: message,
        user_id: userId
      });

      // Save AI response
      const savedResponse = await this.saveMessage({
        conversation_id: conversationId,
        role: 'assistant',
        content: aiResponse,
        user_id: userId
      });

      return {
        id: savedResponse.id,
        role: 'assistant',
        content: aiResponse,
        timestamp: new Date(),
        conversation_id: conversationId
      };

    } catch (error) {
      console.error('AI Coach Service Error:', error);
      throw new Error('Failed to get AI response');
    }
  }

  async analyzeWorkouts(userId: string, workoutIds: string[]): Promise<WorkoutAnalysis> {
    try {
      // Get workout data using correct schema
      const { data: workouts, error } = await supabase
        .from('workout_logs')
        .select('id, name, exercises, start_time, end_time, duration, created_at')
        .in('id', workoutIds)
        .eq('user_id', userId)
        .order('start_time', { ascending: false });

      if (error) throw error;

      // Analyze workout data with AI
      const analysisPrompt = `Analyze these workout logs and provide insights:

${JSON.stringify(workouts, null, 2)}

Provide analysis in this format:
{
  "insights": ["insight1", "insight2"],
  "suggestions": ["suggestion1", "suggestion2"],
  "progressTrend": "improving|plateauing|declining",
  "focusAreas": ["area1", "area2"]
}`;

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [
            { role: 'system', content: 'You are a fitness analysis expert. Analyze workout data and return JSON only.' },
            { role: 'user', content: analysisPrompt }
          ],
          max_tokens: 400,
          temperature: 0.3,
        }),
      });

      const data = await response.json();

      const analysisText = data.choices?.[0]?.message?.content || '{}';
      
      try {
        return JSON.parse(analysisText);
      } catch {
        // Fallback if JSON parsing fails
        return {
          insights: ['Your workout consistency is good!'],
          suggestions: ['Try increasing weight gradually for progressive overload'],
          progressTrend: 'improving' as const,
          focusAreas: ['Form', 'Progressive Overload']
        };
      }

    } catch (error) {
      console.error('Workout Analysis Error:', error);
      throw new Error('Failed to analyze workouts');
    }
  }

  async createConversation(userId: string): Promise<string> {
    const { data, error } = await supabase
      .from('coach_conversations')
      .insert({
        user_id: userId,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return data.id;
  }

  async getConversationHistory(conversationId: string): Promise<ChatMessage[]> {
    const { data, error } = await supabase
      .from('coach_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
      .limit(20); // Last 20 messages for context

    if (error) throw error;

    return data.map((msg: any) => ({
      id: msg.id,
      role: msg.role,
      content: msg.content,
      timestamp: new Date(msg.created_at),
      conversation_id: msg.conversation_id
    }));
  }

  async getConversations(userId: string): Promise<any[]> {
    try {
      // Get all conversations for the user with their latest message
      const { data: conversations, error } = await supabase
        .from('coach_conversations')
        .select(`
          id,
          created_at,
          updated_at
        `)
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      // Get message counts and last messages for each conversation
      const conversationsWithDetails = await Promise.all(
        conversations.map(async (conv) => {
          const { data: messages } = await supabase
            .from('coach_messages')
            .select('content, created_at, role')
            .eq('conversation_id', conv.id)
            .order('created_at', { ascending: false })
            .limit(1);

          const { count } = await supabase
            .from('coach_messages')
            .select('*', { count: 'exact', head: true })
            .eq('conversation_id', conv.id);

          return {
            id: conv.id,
            created_at: conv.created_at,
            updated_at: conv.updated_at,
            message_count: count || 0,
            last_message: messages?.[0]?.content || 'New conversation',
            last_activity: conv.updated_at
          };
        })
      );

      return conversationsWithDetails;
    } catch (error) {
      console.error('Error fetching conversations:', error);
      return [];
    }
  }

  private async saveMessage(message: {
    conversation_id: string;
    role: string;
    content: string;
    user_id: string;
  }) {
    const { data, error } = await supabase
      .from('coach_messages')
      .insert({
        ...message,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;

    // Update conversation's updated_at timestamp
    await supabase
      .from('coach_conversations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', message.conversation_id);

    return data;
  }

  private async getUserWorkoutContext(userId: string) {
    try {
      // Get ALL workouts for comprehensive context
      const { data: allWorkouts, error } = await supabase
        .from('workout_logs')
        .select('id, name, exercises, start_time, end_time, duration, created_at')
        .eq('user_id', userId)
        .order('start_time', { ascending: false });

      if (error) {
        console.error('Error fetching workout context:', error);
        return { recentWorkouts: [], workoutSummary: {} };
      }

      if (!allWorkouts?.length) {
        return { recentWorkouts: [], workoutSummary: {} };
      }

      // Transform workout data
      const transformedWorkouts = allWorkouts.map(workout => ({
        id: workout.id,
        name: workout.name,
        date: workout.start_time,
        duration: workout.duration,
        exercises: workout.exercises?.map((ex: any) => ({
          name: ex.exercise?.name || 'Unknown Exercise',
          muscle_group: ex.exercise?.muscle_group || 'Unknown',
          sets: ex.sets?.length || 0,
          totalVolume: ex.sets?.reduce((total: number, set: any) => {
            const weight = parseFloat(set.weight) || 0;
            const reps = parseFloat(set.performedReps) || 0;
            return total + (weight * reps);
          }, 0) || 0,
          maxWeight: ex.sets?.reduce((max: number, set: any) => {
            const weight = parseFloat(set.weight) || 0;
            return Math.max(max, weight);
          }, 0) || 0
        })) || []
      }));

      // Create comprehensive workout summary
      const exerciseFrequency: { [key: string]: number } = {};
      const exerciseProgress: { [key: string]: { maxWeight: number; totalSets: number; lastPerformed: string } } = {};
      const muscleGroupFrequency: { [key: string]: number } = {};
      
      let totalWorkouts = transformedWorkouts.length;
      let totalDuration = 0;
      let totalVolume = 0;

      transformedWorkouts.forEach(workout => {
        totalDuration += workout.duration || 0;
        
        workout.exercises?.forEach((exercise: any) => {
          const exerciseName = exercise.name;
          const muscleGroup = exercise.muscle_group;
          
          // Track exercise frequency (only if name exists)
          if (exerciseName) {
            exerciseFrequency[exerciseName] = (exerciseFrequency[exerciseName] || 0) + 1;
          }
          
          // Track muscle group frequency (only if muscle group exists)
          if (muscleGroup) {
            muscleGroupFrequency[muscleGroup] = (muscleGroupFrequency[muscleGroup] || 0) + 1;
          }
          
          // Track exercise progress (only if exercise name exists)
          if (exerciseName) {
            if (!exerciseProgress[exerciseName] || exercise.maxWeight > exerciseProgress[exerciseName].maxWeight) {
              exerciseProgress[exerciseName] = {
                maxWeight: exercise.maxWeight,
                totalSets: (exerciseProgress[exerciseName]?.totalSets || 0) + exercise.sets,
                lastPerformed: workout.date
              };
            } else {
              exerciseProgress[exerciseName].totalSets += exercise.sets;
            }
          }
          
          totalVolume += exercise.totalVolume;
        });
      });

      // Get recent 10 workouts for detailed context
      const recentWorkouts = transformedWorkouts.slice(0, 10);

      const workoutSummary = {
        totalWorkouts,
        averageDuration: totalWorkouts > 0 ? Math.round(totalDuration / totalWorkouts / 60) : 0,
        totalVolume: Math.round(totalVolume),
        topExercises: Object.entries(exerciseFrequency)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 10)
          .map(([name, count]) => ({ name, count })),
        muscleGroupDistribution: Object.entries(muscleGroupFrequency)
          .sort(([,a], [,b]) => b - a)
          .map(([group, count]) => ({ group, count })),
        exerciseProgress: Object.entries(exerciseProgress)
          .sort(([,a], [,b]) => b.maxWeight - a.maxWeight)
          .slice(0, 15)
          .map(([name, data]) => ({ name, ...data })),
        workoutFrequency: this.calculateWorkoutFrequency(transformedWorkouts),
        firstWorkoutDate: transformedWorkouts[transformedWorkouts.length - 1]?.date,
        lastWorkoutDate: transformedWorkouts[0]?.date
      };

      return { recentWorkouts, workoutSummary };
    } catch (error) {
      console.error('Error getting user workout context:', error);
      return { recentWorkouts: [], workoutSummary: {} };
    }
  }

  private calculateWorkoutFrequency(workouts: any[]): string {
    if (workouts.length < 2) return 'Insufficient data';
    
    const now = new Date();
    const firstWorkout = new Date(workouts[workouts.length - 1].date);
    const daysDiff = Math.ceil((now.getTime() - firstWorkout.getTime()) / (1000 * 60 * 60 * 24));
    const weeksActive = Math.max(1, Math.ceil(daysDiff / 7));
    const workoutsPerWeek = (workouts.length / weeksActive).toFixed(1);
    
    return `${workoutsPerWeek} workouts/week over ${weeksActive} weeks`;
  }

  private async getAvailableExercises(userId: string) {
    try {
      // Get custom exercises from Supabase
      const customExercises = await exerciseService.getUserExercises();
      
      // Combine with built-in exercises
      const allExercises = [
        // Built-in exercises with proper error handling
        ...exercises
          .filter(ex => ex && ex.name && ex.muscleGroup)
          .map(ex => ({
            name: ex.name,
            muscleGroup: ex.muscleGroup,
            category: ex.category || 'Built-in',
            aliases: ex.aliases || [],
            isCustom: false
          })),
        // Custom exercises with proper error handling
        ...customExercises
          .filter(ex => ex && ex.name && ((ex as any).muscleGroup || ex.muscle_group))
          .map(ex => ({
            name: ex.name,
            muscleGroup: (ex as any).muscleGroup || ex.muscle_group,
            category: ex.category || 'Custom',
            aliases: [],
            isCustom: true
          }))
      ];

      return allExercises;
    } catch (error) {
      console.error('Error getting available exercises:', error);
      // Fallback to just built-in exercises
      return exercises
        .filter(ex => ex && ex.name && ex.muscleGroup)
        .map(ex => ({
          name: ex.name,
          muscleGroup: ex.muscleGroup,
          category: ex.category || 'Built-in',
          aliases: ex.aliases || [],
          isCustom: false
        }));
    }
  }

  private buildContextPrompt(context?: UserContext, workoutData?: any, availableExercises?: any[]): string {
    let prompt = '\n\nUser Context:\n';
    
    if (context?.fatigue_level !== undefined && context.fatigue_level !== null) {
      prompt += `- Energy Level: ${context.fatigue_level}/10\n`;
    }
    
    if (context?.available_time !== undefined && context.available_time !== null) {
      prompt += `- Available Time: ${context.available_time} minutes\n`;
    }
    
    if (context?.goals?.length) {
      prompt += `- Goals: ${context.goals.join(', ')}\n`;
    }

    // Add a separator if we have context
    if (context && (context.fatigue_level || context.available_time || context.goals?.length)) {
      prompt += '\n';
    }

    if (workoutData?.workoutSummary && Object.keys(workoutData.workoutSummary).length > 0) {
      const summary = workoutData.workoutSummary;
      
      prompt += `\n=== COMPLETE WORKOUT HISTORY ANALYSIS ===\n`;
      prompt += `Total Workouts: ${summary.totalWorkouts}\n`;
      prompt += `Workout Frequency: ${summary.workoutFrequency}\n`;
      prompt += `Average Duration: ${summary.averageDuration} minutes\n`;
      prompt += `Total Volume Lifted: ${summary.totalVolume.toLocaleString()} lbs\n`;
      
      if (summary.firstWorkoutDate && summary.lastWorkoutDate) {
        const firstDate = new Date(summary.firstWorkoutDate).toLocaleDateString();
        const lastDate = new Date(summary.lastWorkoutDate).toLocaleDateString();
        prompt += `Training Period: ${firstDate} to ${lastDate}\n`;
      }

      // Top exercises by frequency
      if (summary.topExercises?.length) {
        prompt += `\nTop Exercises by Frequency:\n`;
        summary.topExercises.slice(0, 8).forEach((ex: any, i: number) => {
          if (ex && ex.name) {
            prompt += `${i + 1}. ${ex.name} (${ex.count} workouts)\n`;
          }
        });
      }

      // Muscle group distribution
      if (summary.muscleGroupDistribution?.length) {
        prompt += `\nMuscle Group Focus:\n`;
        summary.muscleGroupDistribution.slice(0, 6).forEach((mg: any) => {
          if (mg && mg.group) {
            prompt += `- ${mg.group}: ${mg.count} exercises\n`;
          }
        });
      }

      // Exercise progress (personal records)
      if (summary.exerciseProgress?.length) {
        prompt += `\nPersonal Records & Exercise Progress:\n`;
        summary.exerciseProgress.slice(0, 10).forEach((prog: any) => {
          if (prog && prog.name) {
            const lastDate = new Date(prog.lastPerformed).toLocaleDateString();
            prompt += `- ${prog.name}: ${prog.maxWeight}lbs max, ${prog.totalSets} total sets, last: ${lastDate}\n`;
          }
        });
      }

      // Recent workout details
      if (workoutData.recentWorkouts?.length) {
        prompt += `\nRecent Workouts (Last 10 sessions):\n`;
        workoutData.recentWorkouts.forEach((workout: any, i: number) => {
          const date = new Date(workout.date).toLocaleDateString();
          const duration = workout.duration ? `${Math.round(workout.duration / 60)}min` : '';
          const exerciseCount = workout.exercises?.length || 0;
          const totalVolume = workout.exercises?.reduce((sum: number, ex: any) => sum + (ex.totalVolume || 0), 0) || 0;
          
          prompt += `${i + 1}. ${workout.name || 'Workout'} (${date}) - ${duration} - ${exerciseCount} exercises`;
          if (totalVolume > 0) {
            prompt += ` - ${Math.round(totalVolume)}lbs volume`;
          }
          prompt += '\n';
          
          // Add exercise details for the most recent workout
          if (i === 0 && workout.exercises?.length) {
            prompt += '   Recent Exercises: ';
            prompt += workout.exercises.map((ex: any) => `${ex.name} (${ex.sets} sets, ${ex.maxWeight}lbs max)`).join(', ');
            prompt += '\n';
          }
        });
      }
      
      prompt += `\n=== END WORKOUT HISTORY ===\n`;
    } else {
      prompt += '\nNo workout history available.\n';
    }

    // Add available exercises database
    if (availableExercises && availableExercises.length > 0) {
      prompt += `\n=== AVAILABLE EXERCISES DATABASE ===\n`;
      prompt += `These are the exercises available in the user's app. ONLY suggest exercises from this list:\n\n`;
      
      // Group exercises by muscle group for better organization
      const exercisesByMuscle = availableExercises
        .filter(exercise => exercise && exercise.name) // Filter out invalid exercises
        .reduce((acc: any, exercise: any) => {
          const muscleGroup = exercise?.muscleGroup || 'Other';
          if (!acc[muscleGroup]) acc[muscleGroup] = [];
          acc[muscleGroup].push(exercise);
          return acc;
        }, {});

      // Display exercises organized by muscle group
      Object.entries(exercisesByMuscle).forEach(([muscleGroup, exerciseList]: [string, any]) => {
        prompt += `\n${muscleGroup.toUpperCase()}:\n`;
        exerciseList.forEach((exercise: any) => {
          const customLabel = exercise.isCustom ? ' (Custom)' : '';
          const aliases = exercise.aliases?.length ? ` [Aliases: ${exercise.aliases.join(', ')}]` : '';
          prompt += `- ${exercise.name}${customLabel}${aliases}\n`;
        });
      });
      
      prompt += `\n=== END EXERCISE DATABASE ===\n`;
      prompt += `REMEMBER: Only suggest exercises from the above list. These exercises are trackable in the user's app.\n`;
    }

    return prompt;
  }
}

export const aiCoachService = new AICoachService();
