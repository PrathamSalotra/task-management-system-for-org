'use client';

import { useAuditLogs } from '@/hooks';
import { Avatar } from '@/components/Avatar';
import { LoadingState } from '@/components/LoadingState';
import { EmptyState } from '@/components/EmptyState';
import { FileText, Clock, Box, Info, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function AuditLogPage() {
  const { data: logs, isLoading, isError } = useAuditLogs();

  if (isLoading) {
    return <LoadingState message="Loading audit logs..." />;
  }

  if (isError) {
    return (
      <div className="p-8 text-center bg-red-50 text-red-600 rounded-xl">
        Failed to load audit logs.
      </div>
    );
  }

  return (
    <div className="max-w-7xl w-full mx-auto space-y-6 pt-6 sm:pt-8 px-4 sm:px-6 md:px-10">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-2 text-sm font-semibold text-text-secondary hover:text-text-primary transition-colors group"
      >
        <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
        Back to Dashboard
      </Link>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-text-primary flex items-center gap-2">
            <FileText className="w-6 h-6 text-indigo-600" />
            Audit Log
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            System activity and security events
          </p>
        </div>
        <div className="px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-indigo-600 text-sm font-bold">
          {logs?.length || 0} Events
        </div>
      </div>

      <div className="bg-surface-card border border-border-subtle rounded-2xl shadow-sm overflow-hidden">
        {logs?.length === 0 ? (
          <div className="p-8">
            <EmptyState
              icon={<FileText className="w-8 h-8 text-indigo-500" />}
              title="No audit logs found"
              description="There are no recent system events."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-muted border-b border-border-subtle text-xs uppercase tracking-wider text-text-secondary font-bold">
                  <th className="p-4">Timestamp</th>
                  <th className="p-4">User</th>
                  <th className="p-4">Action</th>
                  <th className="p-4">Entity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {logs?.map((log) => (
                  <tr key={log.id} className="hover:bg-indigo-50/30 transition-colors">
                    <td className="p-4">
                      <div className="text-sm text-text-secondary flex items-center gap-1.5 font-medium whitespace-nowrap">
                        <Clock className="w-3.5 h-3.5" />
                        {new Date(log.timestamp).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false })}
                      </div>
                    </td>
                    <td className="p-4">
                      {log.user ? (
                        <div className="flex items-center gap-2">
                          <Avatar name={log.user.name} size="xs" />
                          <div className="font-semibold text-text-primary text-sm">
                            {log.user.name}
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs text-text-secondary italic">System</span>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-blue-50 border border-blue-200 text-blue-700 dark:bg-blue-500/10 dark:border-blue-500/20 dark:text-blue-400">
                        <Info className="w-3.5 h-3.5" />
                        {log.action}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <div className="inline-flex items-center gap-1 text-xs font-semibold text-text-secondary uppercase">
                          <Box className="w-3.5 h-3.5" />
                          {log.entityType}
                        </div>
                        <span className="text-xs text-text-muted font-mono truncate max-w-[120px]" title={log.entityId}>
                          {log.entityId.slice(0, 8)}...
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
