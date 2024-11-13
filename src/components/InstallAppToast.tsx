import React from 'react';
import { X, Download } from 'lucide-react';
import { useInstallPrompt } from '../hooks/useInstallPrompt';

export const InstallAppToast: React.FC = () => {
  const { showInstallPrompt, hideInstallPrompt, isInstallable, installApp } = useInstallPrompt();

  if (!isInstallable || !showInstallPrompt) return null;

  return (
    <div className="bg-blue-50 border-b border-blue-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Download size={20} className="text-blue-600 mr-2" />
            <span className="text-sm text-blue-800">
              Install Logday for quick access and offline functionality
            </span>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={installApp}
              className="text-sm font-medium text-blue-600 hover:text-blue-700"
            >
              Install
            </button>
            <button
              onClick={hideInstallPrompt}
              className="text-blue-600 hover:text-blue-700"
            >
              <X size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};