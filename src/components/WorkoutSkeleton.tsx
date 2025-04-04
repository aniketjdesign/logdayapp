import React from 'react';

// Reusable skeleton element component
const SkeletonElement: React.FC<{
  height: string;
  width: string;
  className?: string;
}> = ({ height, width, className = '' }) => (
  <div
    className={`bg-gray-200 rounded animate-pulse ${className}`}
    style={{ height, width }}
  ></div>
);

// Exercise card skeleton component
const ExerciseCardSkeleton: React.FC<{ setsCount?: number }> = ({ setsCount = 3 }) => (
  <div className="bg-white rounded-lg shadow-sm p-4">
    {/* Exercise Header */}
    <div className="flex justify-between items-center mb-4">
      <div className="flex-1">
        <SkeletonElement height="1.5rem" width="15rem" className="mb-2" />
      </div>
    </div>

    {/* Sets */}
    <div className="space-y-2">
      {Array(setsCount).fill(0).map((_, index) => (
        <div key={index} className="flex items-center gap-3">
          <SkeletonElement height="2rem" width="20rem" />

        </div>
      ))}
    </div>
  </div>
);

interface WorkoutSkeletonProps {
  exerciseCount?: number;
  setsPerExercise?: number;
}

export const WorkoutSkeleton: React.FC<WorkoutSkeletonProps> = ({
  exerciseCount = 2,
  setsPerExercise = 3
}) => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 bg-white border-b z-10">
        <div className="p-4">
          <SkeletonElement height="2rem" width="15rem" className="mb-2" />
          <div className="flex space-x-4">
            <SkeletonElement height="1.5rem" width="6rem" />
            <SkeletonElement height="1.5rem" width="6rem" />
            <SkeletonElement height="1.5rem" width="6rem" />
          </div>
        </div>
      </div>

      {/* Exercise Cards */}
      <div className="p-4 pt-28">
        <div className="space-y-4">
          {Array(exerciseCount).fill(0).map((_, index) => (
            <ExerciseCardSkeleton key={index} setsCount={setsPerExercise} />
          ))}
        </div>
      </div>
    </div>
  );
};
