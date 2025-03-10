import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronDown, Folder, Plus, MoreVertical } from 'lucide-react';
import { useWorkout } from '../../context/WorkoutContext';
import { RoutinePreviewCard } from './RoutinePreviewCard';
import { FolderModal, FolderCreator } from './FolderOperations';
import { MoveRoutineModal } from './MoveRoutineModal';

interface FolderMenuProps {
  folderId: string;
  folderName: string;
  routineCount: number;
  onRename: () => void;
  onDelete: () => void;
  onClose: () => void;
  onAddRoutine: () => void;
}

const FolderMenu: React.FC<FolderMenuProps> = ({
  onRename,
  onDelete,
  onClose,
  onAddRoutine,
}) => {
  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.folder-menu')) {
        onClose();
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [onClose]);

  return (
    <motion.div 
      className="folder-menu absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-1 z-50 text-md"
      initial={{ opacity: 0, scale: 0.5, originX: 1, originY: 0 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.5 }}
      transition={{ duration: 0.2, type: "spring", stiffness: 300, damping: 20 }}
    >
      <button
        className="w-full px-4 py-1 text-left hover:bg-gray-50 flex items-center"
        onClick={() => {
          onAddRoutine();
          onClose();
        }}
      >
        Add Routine
      </button>
      <button
        className="w-full px-4 py-2 text-left hover:bg-gray-50"
        onClick={onRename}
      >
        Rename Folder
      </button>
      <button
        className="w-full px-4 py-2 text-left text-red-600 hover:bg-gray-50"
        onClick={onDelete}
      >
        Delete Folder
      </button>
    </motion.div>
  );
};

interface FolderViewProps {
  onFolderSelect: (folderId: string | null) => void;
  selectedFolderId: string | null;
  onEditRoutine: (routine: any) => void;
  onCreateRoutine?: (folderId: string) => void;
}

export const FolderView: React.FC<FolderViewProps> = ({
  onFolderSelect,
  selectedFolderId,
  onEditRoutine,
  onCreateRoutine,
}) => {
  const [showNewFolderModal, setShowNewFolderModal] = useState(false);
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({
    root: true,
  });
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [modalState, setModalState] = useState<{
    mode: 'rename' | 'delete';
    isOpen: boolean;
    folderId: string;
    folderName: string;
    routineCount: number;
  } | null>(null);
  const [showMoveRoutineModal, setShowMoveRoutineModal] = useState(false);
  const [routineToMove, setRoutineToMove] = useState<{ id: string; folderId: string | null } | null>(null);

  const { folders, routines, addFolder, deleteFolder, updateFolder, deleteRoutine, currentWorkout } = useWorkout();

  const isWorkoutActive = !!currentWorkout;

  const disabledMessage = isWorkoutActive ? "Cannot perform this action while a workout is in progress" : "";

  // Memoize routines by folder to prevent unnecessary recalculations
  const routinesByFolder = useMemo(() => {
    const result: { [key: string]: any[] } = { null: [] };
    routines.forEach(routine => {
      const folderId = routine.folder_id || null;
      if (!result[folderId]) {
        result[folderId] = [];
      }
      result[folderId].push(routine);
    });
    return result;
  }, [routines]);

  const handleDeleteFolder = async () => {
    if (!modalState) return;
    
    try {
      await deleteFolder(modalState.folderId);
    } catch (error) {
      console.error('Error deleting folder:', error);
      alert('Failed to delete folder');
    }
  };

  const handleRenameFolder = async (newName?: string) => {
    if (!modalState || !newName?.trim()) return;
    
    try {
      await updateFolder(modalState.folderId, { name: newName.trim() });
    } catch (error) {
      console.error('Error renaming folder:', error);
      alert('Failed to rename folder');
    }
  };

  const toggleFolder = (folderId: string | null) => {
    setExpandedFolders(prev => ({
      ...prev,
      [folderId || 'root']: !prev[folderId || 'root']
    }));
  };

  const handleMoveRoutine = (routineId: string, currentFolderId: string | null) => {
    if (isWorkoutActive) {
      alert(disabledMessage);
      return;
    }
    setRoutineToMove({ id: routineId, folderId: currentFolderId });
    setShowMoveRoutineModal(true);
  };

  // Routines are rendered directly in the renderFolderItem function

  const renderFolderItem = (folderId: string | null, name: string, routines: any[], showOptions = true) => {
    const isExpanded = expandedFolders[folderId || 'root'];
    const hasRoutines = routines.length > 0;
    
    return (
      <motion.div 
        key={folderId || 'root'} 
        className="border rounded-xl bg-white mb-2"
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center group">
          <div
            onClick={() => toggleFolder(folderId)}
            className="p-2 flex items-center w-full"
          >
            <div className="mr-1">
            {isExpanded ? (
              <ChevronDown size={20} className="text-gray-500" />
            ) : (
              <ChevronRight size={20} className="text-gray-500" />
            )}
            </div>
            <Folder size={18} className="mr-2 text-gray-500" />
            <span className="flex text-left font-medium text-md">{name}</span>
            <span className="ml-2 px-1 rounded-lg bg-blue-50 border border-blue-100 text-sm text-blue-500">
              {routines.length}
            </span>
          </div>
          {showOptions && folderId && (
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveMenu(activeMenu === folderId ? null : folderId);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <MoreVertical size={16} className="text-gray-500" />
              </button>
              <AnimatePresence>
                {activeMenu === folderId && (
                  <FolderMenu
                  folderId={folderId}
                  folderName={name}
                  routineCount={routines.length}
                  onRename={() => {
                    setModalState({
                      mode: 'rename',
                      isOpen: true,
                      folderId,
                      folderName: name,
                      routineCount: routines.length,
                    });
                    setActiveMenu(null);
                  }}
                  onDelete={() => {
                    setModalState({
                      mode: 'delete',
                      isOpen: true,
                      folderId,
                      folderName: name,
                      routineCount: routines.length,
                    });
                    setActiveMenu(null);
                  }}
                  onClose={() => setActiveMenu(null)}
                  onAddRoutine={() => {
                    if (isWorkoutActive) {
                      alert(disabledMessage);
                      return;
                    }
                    onCreateRoutine?.(folderId);
                    setActiveMenu(null);
                  }}
                />
                )}
              </AnimatePresence>
            </div>
          )}
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
              {hasRoutines ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.1, duration: 0.2 }}
                >
                  {routines.map((routine, index) => (
                    <motion.div 
                      key={routine.id} 
                      className="py-2 px-2 bg-gray-100"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 + (index * 0.05), duration: 0.2 }}
                    >
                      <RoutinePreviewCard
                        routine={routine}
                        onEdit={() => onEditRoutine(routine)}
                        onDelete={async (routineId) => {
                          if (isWorkoutActive) {
                            alert(disabledMessage);
                            return;
                          }
                          try {
                            await deleteRoutine(routineId);
                          } catch (error) {
                            console.error('Error deleting routine:', error);
                            alert('Failed to delete routine');
                          }
                        }}
                        onMove={() => {
                          if (isWorkoutActive) {
                            alert(disabledMessage);
                            return;
                          }
                          handleMoveRoutine(routine.id, routine.folder_id);
                        }}
                      />
                    </motion.div>
                  ))}
                </motion.div>
              ) : (
                <motion.div 
                  className="py-8 text-center"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.1, duration: 0.2 }}
                >
                  <p className="text-gray-500 mb-1 text-sm">No routines yet</p>
                  <button
                    onClick={() => {
                      if (isWorkoutActive) {
                        alert(disabledMessage);
                        return;
                      }
                      onCreateRoutine?.(folderId || '');
                    }}
                    className="text-blue-600 text-sm hover:text-blue-700 font-medium inline-flex items-center gap-1"
                  >
                    <Plus size={16} />
                    Create a routine
                  </button>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  };

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-md font-medium">Folders</h2>
        <button
          onClick={() => {
            if (isWorkoutActive) {
              alert(disabledMessage);
              return;
            }
            setShowNewFolderModal(true);
          }}
          className="text-blue-600 text-sm flex items-center hover:bg-blue-50 px-3 py-1 rounded-lg"
        >
          <Plus size={14} className="mr-1" />
          Add New
        </button>
      </div>

      {showNewFolderModal && (
        <FolderCreator
          onClose={() => setShowNewFolderModal(false)}
          onSave={async (name) => {
            if (isWorkoutActive) {
              alert(disabledMessage);
              return;
            }
            try {
              await addFolder({ name });
            } catch (error) {
              console.error('Error creating folder:', error);
              alert('Failed to create folder. Please try again.');
            }
          }}
        />
      )}

      {/* Root level routines - only show if there are uncategorized routines */}
      {(routinesByFolder['null'] || []).length > 0 && 
        renderFolderItem(null, 'All Routines', routinesByFolder['null'] || [], false)
      }

      {/* Folders */}
      {folders.map((folder) =>
        renderFolderItem(
          folder.id,
          folder.name,
          routinesByFolder[folder.id] || []
        )
      )}

      {modalState && (
        <FolderModal
          isOpen={modalState.isOpen}
          onClose={() => setModalState(null)}
          onConfirm={async (value?: string) => {
            if (isWorkoutActive) {
              alert(disabledMessage);
              return;
            }
            if (modalState.mode === 'delete') {
              await handleDeleteFolder();
            } else {
              await handleRenameFolder(value);
            }
            setModalState(null);
          }}
          title={modalState.mode === 'delete' ? 'Delete Folder' : 'Rename Folder'}
          message={
            modalState.mode === 'delete'
              ? `Are you sure you want to delete "${modalState.folderName}"? This folder contains ${modalState.routineCount} routine${
                  modalState.routineCount === 1 ? '' : 's'
                }. This action cannot be undone.`
              : `Enter a new name for "${modalState.folderName}"`
          }
          confirmText={modalState.mode === 'delete' ? 'Delete' : 'Rename'}
          mode={modalState.mode}
          initialValue={modalState.mode === 'rename' ? modalState.folderName : ''}
        />
      )}

      {showMoveRoutineModal && routineToMove && (
        <MoveRoutineModal
          isOpen={showMoveRoutineModal}
          onClose={() => {
            setShowMoveRoutineModal(false);
            setRoutineToMove(null);
          }}
          routineId={routineToMove.id}
          currentFolderId={routineToMove.folderId}
        />
      )}
    </div>
  );
};
