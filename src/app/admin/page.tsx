
'use client';

import { useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';

export default function AdminPage() {
  const { user, users, fetchUsers, updateUserStatus } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user?.role !== 'admin') {
      router.push('/');
    }
    fetchUsers();
  }, [user, router, fetchUsers]);

  const handleApprove = async (userId: string) => {
    await updateUserStatus(userId, 'approved');
  };

  const handleReject = async (userId: string) => {
    await updateUserStatus(userId, 'rejected');
  };

  if (user?.role !== 'admin') {
    return <p>Redirecting...</p>;
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Admin - User Management</h1>
      <div className="shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Username</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map((u) => (
              <tr key={u.id}>
                <td className="px-6 py-4 whitespace-nowrap">{u.username}</td>
                <td className="px-6 py-4 whitespace-nowrap">{u.status}</td>
                <td className="px-6 py-4 whitespace-nowrap">{u.role}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {u.status === 'pending' && (
                    <>
                      <button onClick={() => handleApprove(u.id)} className="text-green-600 hover:text-green-900">Approve</button>
                      <button onClick={() => handleReject(u.id)} className="text-red-600 hover:text-red-900 ml-4">Reject</button>
                    </>
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
