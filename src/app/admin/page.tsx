'use client';

import { useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import type { User } from '@/lib/types';

export default function AdminPage() {
  const { user, users, fetchUsers, updateUserStatus } = useAuth();

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchUsers();
    }
  }, [user, fetchUsers]);

  const handleApprove = async (userId: string) => {
    await updateUserStatus(userId, 'approved');
  };

  const handleReject = async (userId: string) => {
    await updateUserStatus(userId, 'disabled');
  };

  if (user?.role !== 'admin') {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold">Access Denied</h1>
        <p>You do not have permission to view this page.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">Admin Dashboard</h1>
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Username</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map((u: User) => (
              <tr key={u.id}>
                <td className="px-6 py-4 whitespace-nowrap">{u.username}</td>
                <td className="px-6 py-4 whitespace-nowrap">{u.status}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {u.status === 'pending' && (
                    <div className="flex space-x-2">
                      <Button onClick={() => handleApprove(u.id)} size="sm">Approve</Button>
                      <Button onClick={() => handleReject(u.id)} variant="destructive" size="sm">Reject</Button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
