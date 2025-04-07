import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Folder, ChevronRight, ChevronDown } from 'lucide-react';
import { supabaseService } from '../../services/supabaseService';
import { RoutinePreviewCard } from './RoutinePreviewCard';

interface LogdayFolder {
  id: string;
  name: string;
  description?: string;
  type: 'folder';
  parent_id?: string;
  created_at: string;
  updated_at: string;
}

interface LogdayRoutine {
  id: string;
  name: string;
  description?: string;
  type: 'routine';
  parent_id?: string;
  exercises: any[];
  total_exercises: number;
  total_sets: number;
  created_at: string;
  updated_at: string;
}

interface LogdayRoutinesViewProps {
  onEditRoutine: (routine: any) => void;
}

export const LogdayRoutinesView: React.FC<LogdayRoutinesViewProps> = ({
  onEditRoutine,
}) => {
  const [folders, setFolders] = useState<LogdayFolder[]>([]);
  const [routines, setRoutines] = useState<LogdayRoutine[]>([]);
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({
    root: true,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchLogdayRoutines = async () => {
      setIsLoading(true);
      try {
        const { folders, routines, error } = await supabaseService.getLogdayRoutines();
        if (error) {
          console.error('Error fetching Logday routines:', error);
          return;
        }
        
        setFolders(folders as LogdayFolder[]);
        setRoutines(routines as LogdayRoutine[]);
      } catch (error) {
        console.error('Error in fetchLogdayRoutines:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLogdayRoutines();
  }, []);

  const toggleFolder = (folderId: string) => {
    setExpandedFolders(prev => ({
      ...prev,
      [folderId]: !prev[folderId]
    }));
  };

  // Group routines by parent folder
  const routinesByFolder = React.useMemo(() => {
    const result: Record<string, LogdayRoutine[]> = {};
    
    // Initialize with empty array for null parent_id
    result['null'] = [];
    
    routines.forEach(routine => {
      const parentId = routine.parent_id || 'null';
      if (!result[parentId]) {
        result[parentId] = [];
      }
      result[parentId].push(routine);
    });
    
    return result;
  }, [routines]);

  const renderFolderItem = (folder: LogdayFolder) => {
    const folderRoutines = routinesByFolder[folder.id] || [];
    const isExpanded = expandedFolders[folder.id] || false;
    
    return (
      <motion.div 
        key={folder.id} 
        className="border rounded-xl bg-white mb-2"
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center group">
          <div
            onClick={() => toggleFolder(folder.id)}
            className="p-2 flex items-center w-full"
          >
            <div className="mr-1">
            {isExpanded ? (
              <ChevronDown size={16} className="text-gray-500" />
            ) : (
              <ChevronRight size={16} className="text-gray-500" />
            )}
            </div>
            <span className="flex text-left font-semibold text-sm">{folder.name}</span>
            <span className="ml-2 px-1 rounded-lg bg-gray-50 border border-gray-100 text-sm text-gray-500">
              {folderRoutines.length}
            </span>
          </div>
        </div>
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              style={{ overflow: 'hidden' }}
            >
              {folderRoutines.length > 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="px-2 py-2 space-y-3 bg-gray-100"
                >
                  {folderRoutines.map(routine => (
                    <RoutinePreviewCard
                      key={routine.id}
                      routine={{
                        id: routine.id,
                        name: routine.name,
                        description: routine.description || '',
                        exercises: routine.exercises,
                        folder_id: routine.parent_id || null,
                        total_exercises: routine.total_exercises,
                        total_sets: routine.total_sets,
                        created_at: routine.created_at,
                        updated_at: routine.updated_at
                      }}
                      onEdit={() => onEditRoutine(routine)}
                      onDelete={() => {}} // No delete option for Logday routines
                      onMove={() => {}} // No move option for Logday routines
                      isLogdayRoutine={true}
                    />
                  ))}
                </motion.div>
              ) : (
                <motion.div 
                  className="py-4 text-center"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.1, duration: 0.2 }}
                >
                  <p className="text-gray-500 text-sm">No routines in this category</p>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  };

  // Root level routines (no parent)
  const rootRoutines = routinesByFolder['null'] || [];

  if (isLoading) {
    return (
      <div className="px-4 py-4">
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div 
              key={i} 
              className="bg-white rounded-lg shadow-sm p-4 animate-pulse">
              <div className="flex justify-between items-center">
                <div className="space-y-2 flex-1">
                  <div className="h-5 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                </div>
                <div className="h-6 w-6 bg-gray-200 rounded-full"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (folders.length === 0 && rootRoutines.length === 0) {
    return (
      <div className="px-4 py-8 text-center">
        <p className="text-gray-500 mb-1">No routines available</p>
        <p className="text-sm text-gray-400">
          Logday routines will appear here when added by administrators
        </p>
      </div>
    );
  }

  return (
    <div className="px-4 py-4">
      {/* Root level routines */}
      {rootRoutines.length > 0 && (
        <div className="mb-6">
          <h2 className="text-md font-medium mb-4">Featured Routines</h2>
          <div className="space-y-3">
            {rootRoutines.map(routine => (
              <RoutinePreviewCard
                key={routine.id}
                routine={{
                  id: routine.id,
                  name: routine.name,
                  description: routine.description || '',
                  exercises: routine.exercises,
                  folder_id: routine.parent_id || null,
                  total_exercises: routine.total_exercises,
                  total_sets: routine.total_sets,
                  created_at: routine.created_at,
                  updated_at: routine.updated_at
                }}
                onEdit={() => onEditRoutine(routine)}
                onDelete={() => {}} // No delete option for Logday routines
                onMove={() => {}} // No move option for Logday routines
                isLogdayRoutine={true}
              />
            ))}
          </div>
        </div>
      )}

      {/* Folders */}
      {folders.length > 0 && (
        <div className="mb-6">
          <h2 className="text-md font-medium mb-4">Featured Routines</h2>
          {folders.map(folder => renderFolderItem(folder))}
        </div>
      )}
    </div>
  );
};
