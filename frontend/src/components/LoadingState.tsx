import React from 'react';

export interface LoadingStateProps {
  message?: string;
  fullScreen?: boolean;
  className?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Loading...',
  fullScreen = false,
  className = '',
}) => {
  const content = (
    <div
      className={`flex flex-col items-center justify-center gap-3 p-8 ${className}`}
    >
      <div className="w-9 h-9 border-3 border-accent border-t-transparent rounded-full animate-spin shadow-sm" />
      {message && (
        <p className="text-sm font-medium text-text-secondary animate-pulse">
          {message}
        </p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="min-h-screen w-full bg-canvas flex items-center justify-center">
        {content}
      </div>
    );
  }

  return content;
};
