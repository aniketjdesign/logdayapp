import React, { useState, useRef } from 'react';
import { Send, Bot, User, Loader2 } from 'lucide-react';
import { ChatMessage } from '../../services/aiCoachService';
import { motion, AnimatePresence } from 'framer-motion';
import { WorkoutSuggestion } from './WorkoutSuggestion';
import { parseWorkoutFromText, isWorkoutSuggestion } from '../../utils/workoutParser';
import { WorkoutExercise } from '../../types/workout';

interface ChatInterfaceProps {
  messages: ChatMessage[];
  onSendMessage: (message: string) => void;
  isLoading: boolean;
  placeholder?: string;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  messages,
  onSendMessage,
  isLoading,
  placeholder = "Ask your AI coach anything..."
}) => {
  const [inputMessage, setInputMessage] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleStartWorkout = (exercises: WorkoutExercise[]) => {
    // This will be handled by the WorkoutSuggestion component
    console.log('Starting workout with exercises:', exercises);
  };



  const handleSend = () => {
    if (inputMessage.trim() && !isLoading) {
      onSendMessage(inputMessage.trim());
      setInputMessage('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Messages Container */}
      <div 
        className="flex-1 overflow-y-auto p-4 space-y-4 pb-6" 
        style={{ 
          minHeight: 0,
          WebkitOverflowScrolling: 'touch',
          overscrollBehavior: 'contain',
          paddingBottom: '320px'
        }}
      >
        <AnimatePresence>
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex max-w-[80%] ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'} items-start space-x-2`}>
                {/* Avatar */}
                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                  message.role === 'user' 
                    ? 'bg-blue-600 text-white ml-2' 
                    : 'bg-gray-200 text-gray-600 mr-2'
                }`}>
                  {message.role === 'user' ? <User size={16} /> : <Bot size={16} />}
                </div>

                {/* Message Content */}
                <div className="flex flex-col space-y-2">
                  {/* Message Bubble */}
                  <div className={`rounded-2xl px-4 py-3 ${
                    message.role === 'user'
                      ? 'bg-blue-600 text-white rounded-br-md'
                      : 'bg-white text-gray-800 rounded-bl-md shadow-sm border border-gray-100'
                  }`}>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">
                      {message.content}
                    </p>
                    <p className={`text-xs mt-2 ${
                      message.role === 'user' ? 'text-blue-200' : 'text-gray-400'
                    }`}>
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>

                  {/* Workout Suggestion */}
                  {message.role === 'assistant' && isWorkoutSuggestion(message.content) && (() => {
                    try {
                      const workoutPlan = parseWorkoutFromText(message.content);
                      return workoutPlan ? (
                        <div className="max-w-full">
                          <WorkoutSuggestion
                            workoutPlan={workoutPlan}
                            onStartWorkout={handleStartWorkout}
                          />
                        </div>
                      ) : null;
                    } catch (error) {
                      console.error('Error rendering workout suggestion:', error);
                      return (
                        <div className="max-w-full p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                          <p className="text-sm text-yellow-800">
                            💡 The AI suggested a workout, but there was an issue displaying it. 
                            You can still follow the workout plan described in the message above!
                          </p>
                        </div>
                      );
                    }
                  })()}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Loading Indicator */}
        {isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-start"
          >
            <div className="flex items-start space-x-2">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center mr-2">
                <Bot size={16} />
              </div>
              <div className="bg-white rounded-2xl rounded-bl-md px-4 py-3 shadow-sm border border-gray-100">
                <div className="flex items-center space-x-2">
                  <Loader2 size={16} className="animate-spin text-gray-400" />
                  <span className="text-sm text-gray-500">AI Coach is thinking...</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}


      </div>

      {/* Input Area */}
      <div 
        className="border-t border-gray-200 bg-white p-4 flex-shrink-0 fixed z-50 w-full"
        style={{ bottom: '96px' }}
      >
        <div className="flex items-center space-x-3">
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={placeholder}
              disabled={isLoading}
              className="w-full px-4 py-3 pr-12 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            />
          </div>
          
          <button
            onClick={handleSend}
            disabled={!inputMessage.trim() || isLoading}
            className="flex-shrink-0 w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};
