import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { useOnboarding } from '../../context/OnboardingContext';
import { 
  Gear, 
  Bug, 
  Lightning 
} from 'phosphor-react';

interface UpdateItem {
  date: string;
  icon: React.ReactNode;
  title: string;
  details: (string | React.ReactNode)[];
}

export const WhatsNewModal: React.FC = () => {
  const { dismissWhatsNew } = useOnboarding();
  const [animationState, setAnimationState] = useState<'initial' | 'animate'>('initial');

  useEffect(() => {
    // Trigger animation after component mounts
    const timer = setTimeout(() => {
      setAnimationState('animate');
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);

  const handleDismiss = async () => {
    await dismissWhatsNew();
  };

  const updates: UpdateItem[] = [
    {
      date: "Latest Update",
      icon: <Bug size={16} weight="fill" color="#EA4335" />,
      title: "Fixes",
      details: [
        <><strong>Rest timer audio fixes:</strong> You can globally enable/disable rest timer. When it's enabled it won't stop your ongoing music.</>,
        <><strong>Superset experience:</strong> Removing an exercise from a superset pair won't affect/remove the other unexpectedly.</>,
        <><strong>Volume accuracy:</strong> Fixed a mismatch between workout logs and review screens.</>,
        <><strong>Notes are cleaner:</strong> Notes markers won't show up unnecessarily when you add notes.</>,
        <><strong>Performance updates:</strong> Logday should feel noticeably faster.</>
      ]
    },
    {
      date: "Latest Update",
      icon: <Lightning size={16} weight="fill" color="#4285F4" />,
      title: "Updates",
      details: [
        <><strong>Open Sign up:</strong> Anyone can now sign up on Logday! no invite code needed.</>,
        <><strong>Smarter search:</strong> Find exercises faster with improved search and alias support.</>,
        <><strong>Uninterrupted access during workouts:</strong> You can now freely use Logday when a workout is active, previously the usage was blocked during an ongoing workout.</>,
        <><strong>Better exercise adding:</strong> Reduced chances of accidentally adding the same exercise twice.</>,
        <><strong>Performance tab:</strong> Now shows more details of your past sessions like set markers, day, and goals.</>
      ]
    },
    {
      date: "Latest Update",
      icon: <Gear size={16} weight="fill" color="#757575" />,
      title: "UI & UX",
      details: [
        <><strong>Routines experience:</strong> More cleaner and concise.</>,
        <><strong>Font tuning:</strong> Clearer text across routines and set options.</>,
        <><strong>Fresh look:</strong> New design for Login, Signup, and Reset Password screens.</>,
        <><strong>iOS icons updated:</strong> Sharper visuals on iPhones.</>,
        <><strong>Unified experience:</strong> Consistent interface across mobile and desktop.</>
      ]
    }
  ];

  // Group updates by date
  const groupedUpdates: Record<string, UpdateItem[]> = {};
  updates.forEach(update => {
    if (!groupedUpdates[update.date]) {
      groupedUpdates[update.date] = [];
    }
    groupedUpdates[update.date].push(update);
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div 
        className={`relative w-full max-w-md bg-white rounded-xl shadow-2xl overflow-hidden transition-all duration-500 ease-out transform ${
          animationState === 'initial' 
            ? 'opacity-0 scale-95 translate-y-8' 
            : 'opacity-100 scale-100 translate-y-0'
        }`}
        style={{
          transitionTimingFunction: animationState === 'animate' ? 'cubic-bezier(0.175, 0.885, 0.32, 1.275)' : 'ease-out'
        }}
      >
        {/* Header */}
        <div className="bg-blue-600 p-4 text-white">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-xl font-bold">What's New in Logday</h1>
            </div>
            <button 
              onClick={handleDismiss}
              className="p-1 rounded-full hover:bg-white/20 transition-colors"
              aria-label="Close"
            >
              <X size={20} className="text-white" />
            </button>
          </div>
        </div>
        
        {/* Content */}
        <div className="max-h-[70vh] overflow-y-auto">
          {Object.entries(groupedUpdates).map(([date, dateUpdates]) => (
            <div key={date} className="border-b border-gray-100 last:border-b-0">
              <div className="px-4 py-2 bg-gray-50 text-blue-600 font-medium text-sm">
                {date}
              </div>
              
              {dateUpdates.map((update, index) => (
                <div key={index} className="px-4 py-3 border-t border-gray-100 first:border-t-0">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex-shrink-0">
                      {update.icon}
                    </div>
                    <div className="flex-grow">
                      <h3 className="font-medium text-gray-900">{update.title}</h3>
                    </div>
                  </div>
                  
                  <div className="pl-4 text-gray-600 space-y-2">
                    {update.details.map((detail, detailIndex) => (
                      <div key={detailIndex} className="flex items-start gap-2">
                        <div className="mt-2 w-1 h-1 rounded-full bg-gray-500 flex-shrink-0"></div>
                        <p className="text-sm">{detail}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
        
        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4 flex justify-end">
          <button
            onClick={handleDismiss}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};
