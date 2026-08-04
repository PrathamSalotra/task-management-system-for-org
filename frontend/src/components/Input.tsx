import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string | null;
  helperText?: string;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  helperText,
  id,
  className = '',
  ...props
}) => {
  return (
    <div className="space-y-1.5 w-full">
      {label && (
        <label
          htmlFor={id}
          className="block text-xs font-bold text-text-primary uppercase tracking-wider"
        >
          {label}
        </label>
      )}
      <input
        id={id}
        className={`w-full px-4 py-3 rounded-xl bg-surface-muted border text-text-primary placeholder-text-secondary/60 focus:outline-none focus:ring-2 transition-all text-sm ${
          error
            ? 'border-red-500/50 focus:ring-red-500 focus:border-red-500'
            : 'border-border-subtle focus:ring-accent focus:border-accent'
        } ${className}`}
        {...props}
      />
      {error && (
        <p className="text-xs text-red-400 font-medium flex items-center gap-1">
          <span>⚠️</span>
          <span>{error}</span>
        </p>
      )}
      {!error && helperText && (
        <p className="text-xs text-text-secondary">{helperText}</p>
      )}
    </div>
  );
};

export interface TextAreaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string | null;
  helperText?: string;
}

export const TextArea: React.FC<TextAreaProps> = ({
  label,
  error,
  helperText,
  id,
  className = '',
  ...props
}) => {
  return (
    <div className="space-y-1.5 w-full">
      {label && (
        <label
          htmlFor={id}
          className="block text-xs font-bold text-text-primary uppercase tracking-wider"
        >
          {label}
        </label>
      )}
      <textarea
        id={id}
        className={`w-full px-4 py-3 rounded-xl bg-surface-muted border text-text-primary placeholder-text-secondary/60 focus:outline-none focus:ring-2 transition-all text-sm ${
          error
            ? 'border-red-500/50 focus:ring-red-500 focus:border-red-500'
            : 'border-border-subtle focus:ring-accent focus:border-accent'
        } ${className}`}
        {...props}
      />
      {error && (
        <p className="text-xs text-red-400 font-medium flex items-center gap-1">
          <span>⚠️</span>
          <span>{error}</span>
        </p>
      )}
      {!error && helperText && (
        <p className="text-xs text-text-secondary">{helperText}</p>
      )}
    </div>
  );
};

export interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string | null;
  helperText?: string;
}

export const Select: React.FC<SelectProps> = ({
  label,
  error,
  helperText,
  id,
  className = '',
  children,
  ...props
}) => {
  return (
    <div className="space-y-1.5 w-full">
      {label && (
        <label
          htmlFor={id}
          className="block text-xs font-bold text-text-primary uppercase tracking-wider"
        >
          {label}
        </label>
      )}
      <select
        id={id}
        className={`w-full px-4 py-3 rounded-xl bg-surface-muted border text-text-primary focus:outline-none focus:ring-2 transition-all text-sm ${
          error
            ? 'border-red-500/50 focus:ring-red-500 focus:border-red-500'
            : 'border-border-subtle focus:ring-accent focus:border-accent'
        } ${className}`}
        {...props}
      >
        {children}
      </select>
      {error && (
        <p className="text-xs text-red-400 font-medium flex items-center gap-1">
          <span>⚠️</span>
          <span>{error}</span>
        </p>
      )}
      {!error && helperText && (
        <p className="text-xs text-text-secondary">{helperText}</p>
      )}
    </div>
  );
};
