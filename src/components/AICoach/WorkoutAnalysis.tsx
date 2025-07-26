import React from 'react';
import { TrendingUp, TrendingDown, Minus, Target, Lightbulb, Activity } from 'lucide-react';
import { WorkoutAnalysis as WorkoutAnalysisType } from '../../services/aiCoachService';
import { motion } from 'framer-motion';

interface WorkoutAnalysisProps {
  analysis: WorkoutAnalysisType;
  isLoading?: boolean;
}

export const WorkoutAnalysis: React.FC<WorkoutAnalysisProps> = ({ 
  analysis, 
  isLoading = false 
}) => {
  const getTrendIcon = () => {
    switch (analysis.progressTrend) {
      case 'improving':
        return <TrendingUp className="text-green-500" size={20} />;
      case 'declining':
        return <TrendingDown className="text-red-500" size={20} />;
      default:
        return <Minus className="text-yellow-500" size={20} />;
    }
  };

  const getTrendColor = () => {
    switch (analysis.progressTrend) {
      case 'improving':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'declining':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    }
  };

  const getTrendText = () => {
    switch (analysis.progressTrend) {
      case 'improving':
        return 'Great Progress!';
      case 'declining':
        return 'Needs Attention';
      default:
        return 'Steady State';
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 space-y-6"
    >
      {/* Progress Trend */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Workout Analysis</h3>
        <div className={`flex items-center space-x-2 px-3 py-1.5 rounded-full border ${getTrendColor()}`}>
          {getTrendIcon()}
          <span className="text-sm font-medium">{getTrendText()}</span>
        </div>
      </div>

      {/* Insights Section */}
      {analysis.insights.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <Activity className="text-blue-600" size={18} />
            <h4 className="font-medium text-gray-900">Key Insights</h4>
          </div>
          <div className="space-y-2">
            {analysis.insights.map((insight, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg border border-blue-100"
              >
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                <p className="text-sm text-blue-800 leading-relaxed">{insight}</p>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Suggestions Section */}
      {analysis.suggestions.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <Lightbulb className="text-yellow-600" size={18} />
            <h4 className="font-medium text-gray-900">Suggestions</h4>
          </div>
          <div className="space-y-2">
            {analysis.suggestions.map((suggestion, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 + 0.2 }}
                className="flex items-start space-x-3 p-3 bg-yellow-50 rounded-lg border border-yellow-100"
              >
                <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2 flex-shrink-0"></div>
                <p className="text-sm text-yellow-800 leading-relaxed">{suggestion}</p>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Focus Areas */}
      {analysis.focusAreas.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <Target className="text-green-600" size={18} />
            <h4 className="font-medium text-gray-900">Focus Areas</h4>
          </div>
          <div className="flex flex-wrap gap-2">
            {analysis.focusAreas.map((area, index) => (
              <motion.span
                key={index}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 + 0.4 }}
                className="px-3 py-1.5 bg-green-100 text-green-800 text-sm font-medium rounded-full border border-green-200"
              >
                {area}
              </motion.span>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
};
