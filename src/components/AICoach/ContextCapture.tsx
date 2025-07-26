import React, { useState, useEffect } from 'react';
import { Clock, Battery, Target, ChevronDown, ChevronUp } from 'lucide-react';
import { UserContext } from '../../services/aiCoachService';
import { motion, AnimatePresence } from 'framer-motion';

interface ContextCaptureProps {
  onContextUpdate: (context: UserContext) => void;
  initialContext?: UserContext;
}

export const ContextCapture: React.FC<ContextCaptureProps> = ({
  onContextUpdate,
  initialContext = {}
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [context, setContext] = useState<UserContext>({
    fatigue_level: 5,
    available_time: 30,
    goals: [],
    ...initialContext
  });

  // Initialize context with default values on mount
  useEffect(() => {
    const defaultContext = {
      fatigue_level: 5,
      available_time: 30,
      goals: [],
      ...initialContext
    };
    setContext(defaultContext);
    onContextUpdate(defaultContext);
  }, []); // Empty dependency array to run only once

  const fatigueLabels = [
    'Exhausted', 'Very Tired', 'Tired', 'Somewhat Tired', 'Neutral',
    'Somewhat Fresh', 'Fresh', 'Very Fresh', 'Energetic', 'Peak Energy'
  ];

  const commonGoals = [
    'Strength Building',
    'Weight Loss',
    'Muscle Gain',
    'Endurance',
    'Flexibility',
    'General Fitness'
  ];

  const handleFatigueChange = (level: number) => {
    const newContext = { ...context, fatigue_level: level };
    setContext(newContext);
    onContextUpdate(newContext);
  };

  const handleTimeChange = (time: number) => {
    const newContext = { ...context, available_time: time };
    setContext(newContext);
    onContextUpdate(newContext);
  };

  const handleGoalToggle = (goal: string) => {
    const currentGoals = context.goals || [];
    const newGoals = currentGoals.includes(goal)
      ? currentGoals.filter(g => g !== goal)
      : [...currentGoals, goal];
    
    const newContext = { ...context, goals: newGoals };
    setContext(newContext);
    onContextUpdate(newContext);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-3 py-2 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors"
      >
        <div className="flex items-center space-x-2">
          <Target className="text-blue-600" size={16} />
          <span className="text-sm font-medium text-gray-900">Quick Context</span>
        </div>
        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>

      {/* Expandable Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="p-4 space-y-6">
              {/* Fatigue Level */}
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Battery className="text-green-600" size={16} />
                  <label className="text-sm font-medium text-gray-700">
                    Energy Level: {fatigueLabels[(context.fatigue_level || 5) - 1]}
                  </label>
                </div>
                <div className="space-y-2">
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={context.fatigue_level || 5}
                    onChange={(e) => handleFatigueChange(parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                    style={{
                      background: `linear-gradient(to right, #ef4444 0%, #f59e0b 50%, #10b981 100%)`
                    }}
                  />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>1</span>
                    <span>5</span>
                    <span>10</span>
                  </div>
                </div>
              </div>

              {/* Available Time */}
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Clock className="text-blue-600" size={16} />
                  <label className="text-sm font-medium text-gray-700">
                    Available Time: {context.available_time || 30} minutes
                  </label>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {[15, 30, 45, 60].map((time) => (
                    <button
                      key={time}
                      onClick={() => handleTimeChange(time)}
                      className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                        context.available_time === time
                          ? 'bg-blue-100 border-blue-300 text-blue-800'
                          : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      {time}m
                    </button>
                  ))}
                </div>
              </div>

              {/* Goals */}
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Target className="text-purple-600" size={16} />
                  <label className="text-sm font-medium text-gray-700">Current Goals</label>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {commonGoals.map((goal) => (
                    <button
                      key={goal}
                      onClick={() => handleGoalToggle(goal)}
                      className={`px-3 py-2 text-sm rounded-lg border transition-colors text-left ${
                        context.goals?.includes(goal)
                          ? 'bg-purple-100 border-purple-300 text-purple-800'
                          : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      {goal}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
