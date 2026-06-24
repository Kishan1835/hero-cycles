import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../api/dashboard';
import { Spinner, ErrorBanner } from '../components/ui/Feedback';
import { useAuth } from '../context/AuthContext';
import { Role } from '../types/domain';

const ROLES: Role[] = ['SALESPERSON', 'PRICING_MANAGER', 'ADMIN'];

export function AdminPage() {
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();

  const { data: users, isLoading, error } = useQuery({ queryKey: ['admin', 'users'], queryFn: adminApi.listUsers });

  const setActive = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => adminApi.setActive(id, isActive),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'users'] }),
  });

  const updateRole = useMutation({
    mutationFn: ({ id, role }: { id: string; role: string }) => adminApi.updateRole(id, role),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'users'] }),
  });

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-steel-900">User management</h1>
        <p className="text-sm text-steel-500">Manage roles and access for all Hero Cycles staff.</p>
      </div>

      {isLoading && <Spinner />}
      {error && <ErrorBanner message={error.message} />}

      {users && (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-steel-200 bg-steel-50 text-left text-xs uppercase tracking-wide text-steel-500">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-steel-100">
              {users.map((u) => {
                const isSelf = u.id === currentUser?.id;
                return (
                  <tr key={u.id}>
                    <td className="px-4 py-3 font-medium text-steel-900">
                      {u.name} {isSelf && <span className="text-xs text-steel-400">(you)</span>}
                    </td>
                    <td className="px-4 py-3 text-steel-600">{u.email}</td>
                    <td className="px-4 py-3">
                      <select
                        value={u.role}
                        disabled={isSelf || updateRole.isPending}
                        onChange={(e) => updateRole.mutate({ id: u.id, role: e.target.value })}
                        className="rounded border border-steel-200 bg-white px-2 py-1 text-xs disabled:opacity-50"
                      >
                        {ROLES.map((r) => (
                          <option key={r} value={r}>{r.replace('_', ' ')}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`badge ${u.isActive ? 'bg-green-50 text-green-700 ring-1 ring-inset ring-green-200' : 'bg-steel-100 text-steel-500'}`}>
                        {u.isActive ? 'Active' : 'Deactivated'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        disabled={isSelf || setActive.isPending}
                        onClick={() => setActive.mutate({ id: u.id, isActive: !u.isActive })}
                        className="btn-secondary px-3 py-1 text-xs disabled:opacity-40"
                      >
                        {u.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
