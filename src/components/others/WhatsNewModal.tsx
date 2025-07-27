import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { useOnboarding } from '../../context/OnboardingContext';
import { 
  Calendar, 
  Key, 
  Brain, 
  User, 
  Gear, 
  Wrench, 
  Bug, 
  Lightning 
} from 'phosphor-react';

interface UpdateItem {
  date: string;
  icon: React.ReactNode;
  title: string;
  details: string[];
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
      date: "Mar 1–21, 2025",
      icon: <Calendar size={16} weight="fill" color="#4285F4" />,
      title: "iOS App is in the Wild",
      details: [
        "The app is now alive and breathing on iOS. Initial rollout complete.",
        "(Yes, we're finally in your pocket)"
      ]
    },
    {
      date: "Mar 9, 2025",
      icon: <Key size={16} weight="fill" color="#A142F4" />,
      title: "Reset Password (Finally)",
      details: [
        "You can now reset your password. Yes, finally. It only took a mild existential crisis — but hey, it works now. 🙃"
      ]
    },
    {
      date: "Mar 9, 2025",
      icon: <Brain size={16} weight="fill" color="#34A853" />,
      title: "Logging Gets Smarter and Easier",
      details: [
        "Swipe left to delete a set.",
        "Mid-workout exercise swap? Yep, append same sets, new gains.",
        "Total volume now shows upon workout completion and looks nice.",
        "Fixed total volume calculation for single-arm movements.",
        "Click the Set number, and access set types (like warm-up, dropset, etc.)",
        "Past notes? You can now pin and scroll back through the last 2 like a gym diary. 📓"
      ]
    },
    {
      date: "Mar 9, 2025",
      icon: <Wrench size={16} weight="fill" color="#F29900" />,
      title: "Routine Builder Upgrades",
      details: [
        "Mark set types while building routines? Go wild.",
        "Reorder or replace exercises while building routines"
      ]
    },
    {
      date: "Mar 9, 2025",
      icon: <Lightning size={16} weight="fill" color="#FBBC05" />,
      title: "Navigation Refresh",
      details: [
        "We dumped the 2020s hamburger menu. Bottom nav is here and it slaps. 🚀"
      ]
    },
    {
      date: "Mar 9, 2025",
      icon: <Lightning size={16} weight="fill" color="#EA4335" />,
      title: "Global UI Improvements",
      details: [
        "Everything's smoother now. Less \"tap and pray,\" more tap and yay."
      ]
    },
    {
      date: "Mar 16, 2025",
      icon: <User size={16} weight="fill" color="#5E35B1" />,
      title: "Profile Page",
      details: [
        "Brand-new profile page is live (more updates soon)",
        "Get your weekly, monthly, and yearly gains broken down.",
        "Settings + Contact are now tucked in here too. Cozy."
      ]
    },
    {
      date: "Mar 18, 2025",
      icon: <Gear size={16} weight="fill" color="#757575" />,
      title: "Settings Upgrades",
      details: [
        "Pick your homepage: Quick Start or Routines. Your app, your vibe.",
        "Disable rest timers globally if you're too alpha for clocks. Can still toggle it per session."
      ]
    },
    {
      date: "Mar 21, 2025",
      icon: <Lightning size={16} weight="fill" color="#4285F4" />,
      title: "Scroll Fixes + Padding Love",
      details: [
        "No more content cut-offs in exercise selection and routine view.",
        "Workout review scrolls like butter now.",
        "Fixed some annoying scroll jitters across the app."
      ]
    },
    {
      date: "Mar 22, 2025",
      icon: <Bug size={16} weight="fill" color="#EA4335" />,
      title: "Bug Fix",
      details: [
        "Workout review popup no longer goes blank after a session. It shows a much nicer summary!"
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
              <p className="text-white/80 text-sm">Latest updates and improvements</p>
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
