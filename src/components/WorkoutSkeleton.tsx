import React from 'react';

export const WorkoutSkeleton: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 bg-white border-b z-10">
        <div className="p-4">
          <div className="h-8 w-48 bg-gray-200 rounded mb-2"></div>
          <div className="flex space-x-4">
            <div className="h-6 w-24 bg-gray-200 rounded"></div>
            <div className="h-6 w-24 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>

      {/* Exercise Cards */}
      <div className="p-4 pt-28">
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="bg-white rounded-lg shadow-sm p-4">
              {/* Exercise Header */}
              <div className="flex justify-between items-center mb-4">
                <div className="flex-1">
                  <div className="h-6 w-40 bg-gray-200 rounded mb-2"></div>
                  <div className="flex gap-2">
                    <div className="h-5 w-20 bg-gray-200 rounded"></div>
                    <div className="h-5 w-16 bg-gray-200 rounded"></div>
                  </div>
                </div>
                <div className="h-8 w-8 bg-gray-200 rounded"></div>
              </div>

              {/* Sets */}
              <div className="space-y-2">
                {[1, 2, 3].map((j) => (
                  <div key={j} className="flex items-center gap-3">
                    <div className="h-8 w-8 bg-gray-200 rounded"></div>
                    <div className="h-8 w-20 bg-gray-200 rounded"></div>
                    <div className="h-8 w-20 bg-gray-200 rounded"></div>
                    <div className="h-8 w-20 bg-gray-200 rounded"></div>
                  </div>
                ))}
              </div>

              {/* Add Set Button */}
              <div className="mt-3 h-10 w-32 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer Actions */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t">
        <div className="flex justify-between items-center">
          <div className="h-10 w-32 bg-gray-200 rounded"></div>
          <div className="h-10 w-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    </div>
  );
};
