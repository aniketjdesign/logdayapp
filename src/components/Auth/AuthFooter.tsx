import React from 'react';
import { LogDayLogo } from '../LogDayLogo';
import { Mail, Globe, MessageCircleMore } from 'lucide-react';

export const AuthFooter: React.FC = () => {
  return (
    <footer className="fixed bottom-0 left-0 right-0 bg-white border-t">
      <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
        <div>
          <button 
            onClick={() => window.location.reload()}
            className="flex items-center hover:opacity-80 transition-opacity"
          >
            <LogDayLogo className="h-6 w-6" />
          </button>
        </div>
        <div className="flex items-center space-x-6">
          <a 
            href="https://logday.fit"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center text-gray-600 hover:text-gray-900 text-sm"
          >
            <Globe className="h-4 w-4 mr-1.5" />
            <span className="hidden sm:inline">Website</span>
          </a>
          <a 
            href="mailto:hello@logday.com"
            className="flex items-center text-gray-600 hover:text-gray-900 text-sm"
          >
            <Mail className="h-4 w-4 mr-1.5" />
            <span className="hidden sm:inline">hello@logday.com</span>
          </a>
          <a 
            href="https://reddit.com/r/logdayapp"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center text-gray-600 hover:text-gray-900 text-sm"
          >
            <MessageCircleMore className="h-4 w-4 mr-1.5" />
            <span className="hidden sm:inline">Reddit</span>
          </a>
        </div>
      </div>
    </footer>
  );
};