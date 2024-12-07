import React from 'react';
import { WorkoutSession } from '../components/WorkoutSession';
import { useWorkout } from '../context/WorkoutContext';
import { useNavigate } from 'react-router-dom';

const WorkoutPage: React.FC = () => {
  const { currentWorkout } = useWorkout();
  const navigate = useNavigate();

  // If no workout is present after a short delay, redirect back
  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (!currentWorkout) {
        navigate('/');
      }
    }, 1000); // 1 second timeout

    return () => clearTimeout(timer);
  }, [currentWorkout, navigate]);

  if (!currentWorkout) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return <WorkoutSession />;
};

export default WorkoutPage;