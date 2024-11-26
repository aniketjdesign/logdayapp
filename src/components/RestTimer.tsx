import React, { useState, useEffect, useRef } from 'react';
import { Plus, Minus, SkipForward } from 'lucide-react';

interface RestTimerProps {
  isOpen: boolean;
  onClose: () => void;
  defaultDuration?: number;
}

const motivationalMessages = [
  'Yeahhh Buddy, Lightweight! Rest up 💪',
  'Great work! Take a breather 🔥',
  'Beast mode! Time to recover 💯',
  'Crushing it! Rest and reload 🚀',
];

export const RestTimer: React.FC<RestTimerProps> = ({
  isOpen,
  onClose,
  defaultDuration = 120,
}) => {
  const [timeLeft, setTimeLeft] = useState(defaultDuration);
  const [message] = useState(
    () => motivationalMessages[Math.floor(Math.random() * motivationalMessages.length)]
  );
  const timerRef = useRef<number>();
  const initialDurationRef = useRef(defaultDuration);

  // Reset timer when opened
  useEffect(() => {
    if (isOpen) {
      setTimeLeft(defaultDuration);
      initialDurationRef.current = defaultDuration;
      startTimer(defaultDuration);
    }

    return () => {
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
      }
    };
  }, [isOpen, defaultDuration]);

  const startTimer = (duration: number) => {
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
    }

    const startTime = Date.now();
    timerRef.current = window.setInterval(() => {
      const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);
      const remaining = Math.max(0, duration - elapsedSeconds);
      
      setTimeLeft(remaining);
      
      if (remaining <= 0) {
        if (timerRef.current) {
          window.clearInterval(timerRef.current);
        }
        onClose();
      }
    }, 200);
  };

  const adjustTime = (seconds: number) => {
    const newDuration = Math.max(0, Math.min(timeLeft + seconds, 600)); // Max 10 minutes
    setTimeLeft(newDuration);
    initialDurationRef.current = Math.max(initialDurationRef.current, newDuration);
    startTimer(newDuration);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = ((initialDurationRef.current - timeLeft) / initialDurationRef.current) * 100;

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay to prevent background interaction */}
      <div className="fixed inset-0 bg-black bg-opacity-50 z-40" />
      
      <div className="fixed inset-x-0 bottom-0 z-50 bg-white rounded-3xl shadow-lg animate-slide-up mx-4 mb-12" style={{ height: 'auto' }}>
        <div className="h-full flex flex-col p-6">
          {/* Motivational Message */}
          <div className="text-center mb-8">
            <p className="text-gray-700">{message}</p>
          </div>

          {/* Timer Display with Inline Controls */}
          <div className="flex-1 flex flex-col">
            <div className="flex items-center justify-center mb-6">
              <button
                onClick={() => adjustTime(-10)}
                className="w-16 h-20 bg-gray-100 rounded-2xl flex items-center justify-center active:bg-gray-200 transition-colors"
              >
                <Minus size={20} className="text-gray-700" />
              </button>

              <div className="text-7xl font-medium text-gray-900 tracking-tight min-w-[240px] text-center">
                {formatTime(timeLeft)}
              </div>

              <button
                onClick={() => adjustTime(10)}
                className="w-16 h-20 bg-gray-100 rounded-2xl flex items-center justify-center active:bg-gray-200 transition-colors"
              >
                <Plus size={20} className="text-gray-700" />
              </button>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-3 bg-gray-200 rounded-full mb-6 overflow-hidden">
              <div
                className="h-full bg-blue-500 transition-all duration-200 ease-linear rounded-full"
                style={{ width: `${100 - progress}%` }}
              />
            </div>

            {/* Skip Button - Less Prominent */}
            <button
              onClick={onClose}
              className="flex items-center justify-center px-4 text-gray-500 text-sm hover:text-gray-700 transition-colors"
            >
              <SkipForward size={16} className="mr-1" />
              Skip timer
            </button>
          </div>
        </div>
      </div>
    </>
  );
};