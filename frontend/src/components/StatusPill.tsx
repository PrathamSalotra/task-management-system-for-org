'use client';

import React from 'react';
import { TaskStatus } from '../lib/api/types';

interface StatusPillProps {
  status: TaskStatus | string;
  className?: string;
}

export function StatusPill({ status, className = '' }: StatusPillProps) {
  let bgClass = 'bg-status-todo-bg';
  let textClass = 'text-status-todo-text';
  let label = 'To Do';
  let shortLabel = 'TD';

  if (status === 'IN_PROGRESS') {
    bgClass = 'bg-status-in-progress-bg';
    textClass = 'text-status-in-progress-text';
    label = 'In Progress';
    shortLabel = 'IP';
  } else if (status === 'COMPLETED') {
    bgClass = 'bg-status-completed-bg';
    textClass = 'text-status-completed-text';
    label = 'Completed';
    shortLabel = 'CP';
  } else if (status === 'TODO') {
    bgClass = 'bg-status-todo-bg';
    textClass = 'text-status-todo-text';
    label = 'To Do';
    shortLabel = 'TD';
  } else {
    label = status ? String(status).replace(/_/g, ' ') : 'Unknown';
    shortLabel = label.substring(0, 2).toUpperCase();
  }

  return (
    <span
      className={`inline-flex items-center justify-center px-2.5 py-1 rounded-pill text-xs font-semibold whitespace-nowrap ${bgClass} ${textClass} ${className}`}
    >
      <span className="@max-[90px]:hidden">{label}</span>
      <span className="hidden @max-[90px]:inline">{shortLabel}</span>
    </span>
  );
}
