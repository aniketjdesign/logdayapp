import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';

interface ChangelogModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ChangelogModal: React.FC<ChangelogModalProps> = ({ isOpen, onClose }) => {
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        onClose();
      }, 30000);

      return () => clearTimeout(timer);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-md w-full">
        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-2xl font-bold">What's New? 🚀</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <div className="prose prose-blue">
            <p className="text-gray-600">Hi! Aniket from LogDay. Never skip Log Day</p>
            <p className="text-gray-600">I've shipped few good improvements to this app. Listed below!</p>

            <div className="space-y-4 mt-4">
              <div>
                <h3 className="text-lg font-semibold flex items-center">
                  Shoulder exercises are now available 🪨
                </h3>
                <p className="text-gray-600">
                  Tbh not sure why I forgot this one while building in the first place lol. 
                  Go build them boulder shoulders!
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold">Workout reviews 🧗</h3>
                <p className="text-gray-600">
                  You will now be able to see a review of your workout once you complete it. 
                  To look upon the greatness you just achieved. Lot of cool highlights here. Check it!
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold">0.25kgs weight increments 🏋️</h3>
                <p className="text-gray-600">
                  You can increase the weights on your exercises in 0.25kg increments 
                  instead of 1kg like previously.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold">Fresh new PR button!</h3>
                <p className="text-gray-600">
                  to mark a set as PR!
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