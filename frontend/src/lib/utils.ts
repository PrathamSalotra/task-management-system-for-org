export function formatDate(dateStr?: string | Date | null): string {
  if (!dateStr) return 'No Date';
  try {
    const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(date);
  } catch {
    return 'Invalid Date';
  }
}

export function getStatusBadgeStyle(status?: string): {
  bg: string;
  text: string;
  border: string;
  label: string;
} {
  switch (status?.toUpperCase()) {
    case 'PLANNED':
      return {
        bg: 'bg-blue-500/10',
        text: 'text-blue-400',
        border: 'border-blue-500/20',
        label: 'Planned',
      };
    case 'IN_PROGRESS':
      return {
        bg: 'bg-amber-500/10',
        text: 'text-amber-400',
        border: 'border-amber-500/20',
        label: 'In Progress',
      };
    case 'COMPLETED':
      return {
        bg: 'bg-emerald-500/10',
        text: 'text-emerald-400',
        border: 'border-emerald-500/20',
        label: 'Completed',
      };
    case 'ARCHIVED':
      return {
        bg: 'bg-slate-500/10',
        text: 'text-slate-400',
        border: 'border-slate-500/20',
        label: 'Archived',
      };
    default:
      return {
        bg: 'bg-indigo-500/10',
        text: 'text-indigo-400',
        border: 'border-indigo-500/20',
        label: status || 'Unknown',
      };
  }
}

export function getAvatarInitials(name?: string): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function getTaskStatusBadgeStyle(status?: string): {
  bg: string;
  text: string;
  border: string;
  label: string;
} {
  switch (status?.toUpperCase()) {
    case 'TODO':
      return {
        bg: 'bg-slate-500/10',
        text: 'text-slate-300',
        border: 'border-slate-500/20',
        label: 'To Do',
      };
    case 'IN_PROGRESS':
      return {
        bg: 'bg-amber-500/10',
        text: 'text-amber-400',
        border: 'border-amber-500/20',
        label: 'In Progress',
      };
    case 'COMPLETED':
      return {
        bg: 'bg-emerald-500/10',
        text: 'text-emerald-400',
        border: 'border-emerald-500/20',
        label: 'Completed',
      };
    default:
      return {
        bg: 'bg-indigo-500/10',
        text: 'text-indigo-400',
        border: 'border-indigo-500/20',
        label: status || 'Unknown',
      };
  }
}

export function getPriorityBadgeStyle(priority?: string): {
  bg: string;
  text: string;
  border: string;
  label: string;
} {
  switch (priority?.toUpperCase()) {
    case 'LOW':
      return {
        bg: 'bg-blue-500/10',
        text: 'text-blue-400',
        border: 'border-blue-500/20',
        label: 'Low',
      };
    case 'MEDIUM':
      return {
        bg: 'bg-amber-500/10',
        text: 'text-amber-400',
        border: 'border-amber-500/20',
        label: 'Medium',
      };
    case 'HIGH':
      return {
        bg: 'bg-rose-500/10',
        text: 'text-rose-400',
        border: 'border-rose-500/20',
        label: 'High',
      };
    default:
      return {
        bg: 'bg-slate-500/10',
        text: 'text-slate-400',
        border: 'border-slate-500/20',
        label: priority || 'Normal',
      };
  }
}

export function formatFileSize(bytes?: number): string {
  if (bytes === undefined || bytes === null || isNaN(bytes)) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
