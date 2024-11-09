import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface ChangelogModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ChangelogModal: React.FC<ChangelogModalProps> = ({ isOpen, onClose }) => {
  useEffect(() => {
    if (isOpen) {
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
      
      // Auto-close after 7 seconds
      const timer = setTimeout(() => {
        onClose();
      }, 7000);

      return () => {
        // Re-enable body scroll when modal closes
        document.body.style.overflow = 'unset';
        clearTimeout(timer);
      };
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-xl w-full max-w-md my-8 max-h-[80vh] flex flex-col relative">
        <div className="p-6 border-b flex-shrink-0">
          <div className="flex justify-between items-start">
            <h2 className="text-2xl font-bold">What's New? 🚀</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors -mr-2 -mt-2"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto flex-1 scrollbar-thin">
          <div className="prose prose-blue">
            <p className="text-gray-600">Hey there! Aniket from Logday here. Just dropped some fresh updates to make your workout tracking even better. Check 'em out!</p>

            <div className="space-y-4 mt-4">
              <div>
                <h3 className="text-lg font-semibold flex items-center">
                Shoulder exercises are live 💪
                </h3>
                <p className="text-gray-600">
                Can't believe I missed adding these from the start! But better late than never—now you can add shoulder exercises at any point during your workout.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold flex items-center">
                  Finish Workout & Cancel Workout 🕰️
                </h3>
                <p className="text-gray-600">
                Added a "Finish Workout" option with a quick confirmation pop-up to prevent any accidental taps. Plus, you can fully cancel a workout now if you need to bail tho I'll be sad if you quit on a workout 😔
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold">Workout Reviews 🏋️‍♂️</h3>
                <p className="text-gray-600">
                After you wrap up, you'll get a cool summary of your workout. Look back at the hard work you put in and see all the highlights!
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold">0.25kg Weight Increments 🏋️</h3>
                <p className="text-gray-600">
                Adjust weights in 0.25kg steps instead of the previous 1kg jumps. Fine-tune those lifts like a pro.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold">Fresh new PR button!</h3>
                <p className="text-gray-600">
                Got a fresh personal record? Hit that shiny new button to log it with pride!
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold">Some other minor UI tweaks :D</h3>
              </div>
            </div>

            <div className="mt-8 pt-4 border-t text-sm text-gray-500">
              <p>
                Improvements suggested by{' '}
                <a 
                  href="https://www.instagram.com/raichu.copper/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-700"
                >
                  @raichu.copper
                </a>  <p> and </p>
                <a 
                  href="https://www.instagram.com/kobaltkaria/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-700"
                >
               @kobaltkaria
                </a>
              </p>
              <p className="mt-2">
                Have suggestions to improve the app? DM me on{' '}
                <a 
                  href="https://www.instagram.com/aniketjatav" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-700"
                >
                  IG
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};