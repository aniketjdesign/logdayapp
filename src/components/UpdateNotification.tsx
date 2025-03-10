import React from 'react'
import { useAppUpdate } from '../hooks/useAppUpdate'
import { RefreshCw } from 'lucide-react'

interface UpdateNotificationProps {
  // Optional custom onUpdate handler
  onUpdate?: () => void;
  // Optional custom message
  message?: string;
}

export function UpdateNotification({ 
  onUpdate,
  message = 'A new version is available!'
}: UpdateNotificationProps = {}) {
  // Use the app update hook for default behavior
  const { needRefresh, updateApp } = useAppUpdate()

  // If no update is needed and no custom handler is provided, don't render anything
  if (!needRefresh && !onUpdate) return null

  // Use the provided onUpdate handler or fall back to the hook's updateApp function
  const handleUpdate = onUpdate || updateApp

  return (
    <div className="fixed bottom-4 left-4 right-4 z-[9999] bg-blue-600 text-white p-4 rounded-lg shadow-lg flex justify-between items-center animate-fade-in">
      <span className="text-sm">{message}</span>
      <button
        onClick={handleUpdate}
        className="bg-white text-blue-600 px-4 py-2 text-sm rounded-md font-medium hover:bg-blue-50 transition-colors flex items-center"
      >
        <RefreshCw size={16} className="mr-2" />
        Update Now
      </button>
    </div>
  )
}
