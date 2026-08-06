'use client';

import { useUsers } from '@/hooks';
import { Avatar } from '@/components/Avatar';
import { LoadingState } from '@/components/LoadingState';
import { EmptyState } from '@/components/EmptyState';
import { Users, Mail, Clock, Shield, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function UsersPage() {
  const { data: users, isLoading, isError } = useUsers();

  if (isLoading) {
    return <LoadingState message="Loading users..." />;
  }

  if (isError) {
    return (
      <div className="p-8 text-center bg-red-50 text-red-600 rounded-xl">
        Failed to load users.
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
            <Users className="w-6 h-6 text-indigo-600" />
            Users
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            Manage all users in the workspace
          </p>
        </div>
        <div className="px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-indigo-600 text-sm font-bold">
          {users?.length || 0} Total
        </div>
      </div>

      <div className="bg-surface-card border border-border-subtle rounded-2xl shadow-sm overflow-hidden">
        {users?.length === 0 ? (
          <div className="p-8">
            <EmptyState
              icon={<Users className="w-8 h-8 text-indigo-500" />}
              title="No users found"
              description="There are no users registered in the workspace."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-muted border-b border-border-subtle text-xs uppercase tracking-wider text-text-secondary font-bold">
                  <th className="p-4">User</th>
                  <th className="p-4">Role</th>
                  <th className="p-4">Joined At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {users?.map((user) => (
                  <tr key={user.id} className="hover:bg-indigo-50/30 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <Avatar name={user.name} size="md" />
                        <div>
                          <div className="font-bold text-text-primary">
                            {user.name}
                          </div>
                          <div className="text-xs text-text-secondary flex items-center gap-1 mt-0.5">
                            <Mail className="w-3 h-3" />
                            {user.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-surface-muted border border-border-subtle text-text-secondary">
                        <Shield className="w-3.5 h-3.5" />
                        {user.role.replace('_', ' ')}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="text-sm text-text-secondary flex items-center gap-1.5 font-medium">
                        <Clock className="w-3.5 h-3.5" />
                        {new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
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
