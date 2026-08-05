'use client';

import React from 'react';
import { TaskPriority } from '../lib/api/types';

interface PriorityBadgeProps {
  priority: TaskPriority | string;
  className?: string;
}

export function PriorityBadge({
  priority,
  className = '',
}: PriorityBadgeProps) {
  let bgClass = 'bg-priority-low-bg';
  let textClass = 'text-priority-low-text';
  let label = 'Low';
  let shortLabel = 'L';

  if (priority === 'MEDIUM') {
    bgClass = 'bg-priority-medium-bg';
    textClass = 'text-priority-medium-text';
    label = 'Medium';
    shortLabel = 'M';
  } else if (priority === 'HIGH') {
    bgClass = 'bg-priority-high-bg';
    textClass = 'text-priority-high-text';
    label = 'High';
    shortLabel = 'H';
  } else if (priority === 'LOW') {
    bgClass = 'bg-priority-low-bg';
    textClass = 'text-priority-low-text';
    label = 'Low';
    shortLabel = 'L';
  } else {
    label = priority ? String(priority) : 'Normal';
    shortLabel = label.substring(0, 1).toUpperCase();
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
