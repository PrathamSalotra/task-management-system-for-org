import React from 'react';
import { Avatar } from './Avatar';

export interface AvatarStackMember {
  id?: string;
  userId?: string;
  name: string;
  email?: string;
}

export interface AvatarStackProps {
  members: AvatarStackMember[];
  max?: number;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const SIZE_CLASSES: Record<string, string> = {
  xs: 'w-6 h-6 text-[10px]',
  sm: 'w-7 h-7 text-xs',
  md: 'w-9 h-9 text-xs',
  lg: 'w-11 h-11 text-sm',
  xl: 'w-14 h-14 text-base',
};

export const AvatarStack: React.FC<AvatarStackProps> = ({
  members = [],
  max = 4,
  size = 'sm',
  className = '',
}) => {
  if (!members || members.length === 0) {
    return null;
  }

  const visibleMembers = members.slice(0, max);
  const overflowMembers = members.slice(max);
  const overflowCount = overflowMembers.length;
  const sizeClass = SIZE_CLASSES[size] || SIZE_CLASSES.sm;

  return (
    <div className={`flex items-center -space-x-2 overflow-hidden ${className}`}>
      {visibleMembers.map((member, index) => {
        const key = member.id || member.userId || `${member.name}-${index}`;
        return (
          <Avatar
            key={key}
            name={member.name}
            size={size}
            className="ring-2 ring-slate-950"
            title={`${member.name}${member.email ? ` (${member.email})` : ''}`}
          />
        );
      })}

      {overflowCount > 0 && (
        <div
          className={`inline-flex items-center justify-center rounded-full font-bold bg-slate-800 text-slate-300 border border-slate-700 ring-2 ring-slate-950 shrink-0 select-none shadow-sm ${sizeClass}`}
          title={`${overflowCount} more member${overflowCount === 1 ? '' : 's'}: ${overflowMembers.map((m) => m.name).join(', ')}`}
        >
          +{overflowCount}
        </div>
      )}
    </div>
  );
};
