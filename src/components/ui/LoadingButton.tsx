import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean;
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'danger';
}

export const LoadingButton: React.FC<LoadingButtonProps> = ({
  isLoading,
  children,
  variant = 'primary',
  className = '',
  disabled,
  ...props
}) => {
  const getVariantClasses = () => {
    switch (variant) {
      case 'danger':
        return 'bg-red-600 hover:bg-red-700 text-white disabled:bg-red-400';
      case 'secondary':
        return 'bg-gray-100 hover:bg-gray-200 text-gray-700 disabled:bg-gray-100';
      default:
        return 'bg-blue-600 hover:bg-blue-700 text-white disabled:bg-blue-400';
    }
  };

  return (
    <button
      className={`flex items-center justify-center px-4 py-2 rounded-lg transition-colors ${getVariantClasses()} ${className}`}
      disabled={isLoading || disabled}
      {...props}
    >
      {isLoading ? (
        <>
          <Loader2 size={16} className="animate-spin mr-2" />
          Loading...
        </>
      ) : (
        children
      )}
    </button>
  );
};
