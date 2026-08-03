export function formatDate(dateStr?: string | Date): string {
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
