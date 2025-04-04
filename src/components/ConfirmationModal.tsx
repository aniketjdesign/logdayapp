import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { ConfirmationPopup as BaseConfirmationModal } from './ui/Popup';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText: string;
  confirmButtonClass?: string;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText,
  confirmButtonClass = 'bg-blue-600 hover:bg-blue-700'
}) => {
  return (
    <BaseConfirmationModal
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
      title={title}
      message={message}
      confirmText={confirmText}
      confirmButtonClass={confirmButtonClass}
      icon={<AlertTriangle className="h-6 w-6 text-yellow-500" />}
    />
  );
};