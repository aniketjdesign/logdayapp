import React, { useRef } from 'react';
import { WorkoutSet } from '../../types/workout';

interface SetIndicatorPopoverProps {
  set: WorkoutSet;
  showSetTypeMenu: boolean;
  setShowSetTypeMenu: (show: boolean) => void;
  setNumberRef: React.RefObject<HTMLDivElement>;
  handleSetTypeUpdate: (type: 'isWarmup' | 'isDropset' | 'isFailure' | 'isPR', value: boolean) => void;
  hasNonWarmupType: boolean;
  hidePROption?: boolean;
}

export const SetIndicatorPopover: React.FC<SetIndicatorPopoverProps> = ({
  set,
  showSetTypeMenu,
  setShowSetTypeMenu,
  setNumberRef,
  handleSetTypeUpdate,
  hasNonWarmupType,
  hidePROption = false,
}) => {
  const setTypeMenuRef = useRef<HTMLDivElement>(null);

  // Get set type abbreviation
  const getSetTypeAbbreviation = () => {
    if (set.isWarmup) return "W";
    if (set.isDropset) return "D";
    if (set.isPR) return "🏆";
    if (set.isFailure && !set.isPR && !set.isDropset) return "F";
    return set.setNumber.toString();
  };

  // Get set type text color
  const getSetTypeTextColor = () => {
    if (set.isWarmup) return "text-orange-600";
    if (set.isDropset) return "text-purple-600";
    if (set.isPR) return "text-yellow-700";
    if (set.isFailure && !set.isPR && !set.isDropset) return "text-red-600";
    return "text-gray-500";
  };

  // Get set type background color
  const getSetTypeBgColor = () => {
    if (set.isWarmup) return "bg-orange-50 border-orange-100";
    if (set.isDropset) return "bg-purple-50 border-purple-100";
    if (set.isPR) return "bg-yellow-50 border-yellow-100";
    if (set.isFailure && !set.isPR && !set.isDropset) return "bg-red-50 border-red-100";
    return "bg-gray-50 border-gray-200";
  };

  const getSetTypeButton = (
    type: 'isWarmup' | 'isDropset' | 'isFailure' | 'isPR',
    label: string,
    color: string,
    isNew: boolean = false,
    disabled: boolean = false
  ) => (
    <button
      onClick={() => {
        handleSetTypeUpdate(type, !set[type]);
        // Automatically close the menu after selection
        setShowSetTypeMenu(false);
      }}
      disabled={disabled}
      className={`w-full px-4 py-2 text-left text-sm flex items-center justify-between ${
        disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'
      } rounded-lg`}
    >
      <div className="flex items-center">
        <div className={`w-3 h-3 rounded-full ${color} mr-3`} />
        <span>{set[type] ? `Remove ${label}` : `${label}`}</span>
      </div>
      {isNew && <NewTag />}
    </button>
  );

  const NewTag = () => (
    <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-600">
      NEW
    </span>
  );

  return (
    <>
      <div 
        className={`flex items-center justify-center w-[34px] h-[34px] rounded-lg border cursor-pointer hover:opacity-90 ${getSetTypeBgColor()} ${getSetTypeTextColor()} relative`}
        onClick={() => setShowSetTypeMenu(true)}
      >
        <span className="text-sm font-medium">{getSetTypeAbbreviation()}</span>
        {/* Calculate the number of indicators */}
        {(() => {
          const indicators = [];
          if (set.isFailure && (set.isPR || set.isDropset)) indicators.push('failure');
          if (set.isPR && set.isDropset) indicators.push('pr');
          if (set.comments) indicators.push('notes');
          
          // If only one indicator, position it at the top right
          if (indicators.length === 1) {
            return (
              <>
                {indicators[0] === 'failure' && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-red-500 border border-white"></div>
                )}
                {indicators[0] === 'pr' && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-yellow-400 border border-white"></div>
                )}
                {indicators[0] === 'notes' && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-blue-500 border border-white"></div>
                )}
              </>
            );
          }
          
          // If exactly two indicators, use a specific layout
          if (indicators.length === 2) {
            return (
              <div className="absolute -right-1 -top-1 flex flex-col space-y-[-5px]">
                {set.isFailure && (set.isPR || set.isDropset) && (
                  <div className="w-3 h-3 rounded-full bg-red-500 border border-white"></div>
                )}
                
                {set.isPR && set.isDropset && (
                  <div className="w-3 h-3 rounded-full bg-yellow-400 border border-white"></div>
                )}
                
                {set.comments && (
                  <div className="w-3 h-3 rounded-full bg-blue-500 border border-white"></div>
                )}
              </div>
            );
          }
          
          // If three indicators, stack them
          if (indicators.length === 3) {
            return (
              <div className="absolute -right-1 -top-0 flex flex-col space-y-[-5px]">
                {set.isFailure && (set.isPR || set.isDropset) && (
                  <div className="-mt-1 w-3 h-3 rounded-full bg-red-500 border border-white"></div>
                )}
                
                {set.isPR && set.isDropset && (
                  <div className="w-3 h-3 rounded-full bg-yellow-400 border border-white"></div>
                )}
                
                {set.comments && (
                  <div className="w-3 h-3 rounded-full bg-blue-500 border border-white"></div>
                )}
              </div>
            );
          }
          
          return null;
        })()}
      </div>

      {/* Set Type Popover Menu */}
      {showSetTypeMenu && (
        <div className="fixed inset-0 z-40" onClick={() => setShowSetTypeMenu(false)}>
          <div 
            ref={setTypeMenuRef}
            className="absolute bg-white rounded-lg shadow-lg z-50 w-48 p-2 border border-gray-200"
            style={{
              top: setNumberRef.current ? setNumberRef.current.getBoundingClientRect().bottom + 5 : 0,
              left: setNumberRef.current ? setNumberRef.current.getBoundingClientRect().left : 0
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="space-y-1">
              {/* Warmup Set */}
              {getSetTypeButton('isWarmup', 'Warmup', 'bg-orange-500', false, hasNonWarmupType)}
              
              {/* PR Set - Only show if not hidden */}
              {!hidePROption && getSetTypeButton('isPR', 'PR', 'bg-yellow-400', false, set.isWarmup)}
              
              {/* Failure Set */}
              {getSetTypeButton('isFailure', 'Failure', 'bg-red-500', false, set.isWarmup)}
              
              {/* Drop Set */}
              {getSetTypeButton('isDropset', 'Dropset', 'bg-purple-500', false, set.isWarmup)}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
