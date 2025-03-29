import React, { useEffect } from 'react';
import { Clock, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const OngoingWorkoutMessage: React.FC = () => {
  const navigate = useNavigate();

  // Add click-blocking overlay when component mounts
  useEffect(() => {
    // Create overlay element
    const overlay = document.createElement('div');
    overlay.id = 'workout-click-blocker';
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100%';
    overlay.style.height = '100%';
    overlay.style.backgroundColor = 'transparent';
    overlay.style.zIndex = '30'; // Below the navigation (z-40) but above most content
    overlay.style.pointerEvents = 'all';
    
    // Add overlay to body
    document.body.appendChild(overlay);
    
    // Handle click events on the overlay
    const handleOverlayClick = (e: MouseEvent) => {
      // Prevent all clicks from propagating
      e.preventDefault();
      e.stopPropagation();
    };
    
    overlay.addEventListener('click', handleOverlayClick);
    
    // Cleanup function to remove overlay when component unmounts
    return () => {
      overlay.removeEventListener('click', handleOverlayClick);
      document.body.removeChild(overlay);
    };
  }, []);

  return (
    <>
      <div className="bg-slate-700 rounded-b-2xl p-4 w-full sm:flex sm:items-center sm:justify-between" style={{ position: 'relative', zIndex: 999, pointerEvents: 'auto' }}>
        <div className="flex justify-center items-center mb-3 sm:mb-0">
          <Clock className="h-3 w-3 text-white mr-1 flex-shrink-0" />
          <span className="text-white text-sm sm:text-base font-medium">You have an ongoing workout</span>
        </div>
        <button
          onClick={() => navigate('/workout')}
          className="w-full sm:w-auto px-4 py-2.5 bg-orange-600 text-white rounded-lg hover:bg-orange-700 text-sm font-medium flex items-center justify-center sm:justify-start transition-colors"
        >
          <ArrowLeft size={16} className="mr-1.5" />
          Return to Workout
        </button>
      </div>
    </>
  );
};