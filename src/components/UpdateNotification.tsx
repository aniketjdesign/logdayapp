import React from 'react'
import { useAppUpdate } from '../hooks/useAppUpdate'

export function UpdateNotification() {
  const { needRefresh, updateApp } = useAppUpdate()

  if (!needRefresh) return null

  return (
    <div className="fixed bottom-4 left-4 right-4 z-[9999] bg-blue-600 text-white p-4 rounded-lg shadow-lg flex justify-between items-center">
      <span className="text-sm">A new version is available!</span>
      <button
        onClick={updateApp}
        className="bg-white text-blue-600 px-4 py-2 text-sm rounded-md font-medium hover:bg-blue-50 transition-colors"
      >
        Update Now
      </button>
    </div>
  )
}
