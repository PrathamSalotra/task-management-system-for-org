import React from 'react';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon = '✨',
  title,
  description,
  action,
  className = '',
}) => {
  return (
    <div
      className={`p-8 sm:p-10 rounded-[20px] bg-surface-muted/60 border border-border-subtle text-center flex flex-col items-center justify-center gap-3 shadow-sm ${className}`}
    >
      <div className="w-12 h-12 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center text-xl shadow-inner">
        {icon}
      </div>
      <div className="max-w-sm space-y-1">
        <h4 className="text-base font-bold text-text-primary">{title}</h4>
        {description && (
          <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">
            {description}
          </p>
        )}
      </div>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
};
