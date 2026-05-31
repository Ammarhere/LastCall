import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';

export default function UsersPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn:  () => api.get('/admin/users').then((r) => r.data.data),
  });

  return (
    <div className="p-8">
      <h1 className="text-2xl font-black text-gray-900 mb-2">Customers</h1>
      <p className="text-gray-500 text-sm mb-6">{data?.length ?? 0} registered customers</p>

      {isLoading ? <div className="text-center text-gray-400 py-20">Loading...</div> : (
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['Name', 'Phone', 'Email', 'Orders', 'Joined'].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {(data ?? []).map((u: any) => (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-semibold text-gray-900">{u.name ?? '—'}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{u.phone}</td>
                  <td className="px-4 py-3 text-sm text-gray-400">{u.email ?? '—'}</td>
                  <td className="px-4 py-3 text-sm font-bold text-green-700">{u._count?.orders ?? 0}</td>
                  <td className="px-4 py-3 text-xs text-gray-400">{new Date(u.createdAt).toLocaleDateString('en-PK')}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!data?.length && <p className="text-center text-gray-400 py-10">No customers yet</p>}
        </div>
      )}
    </div>
  );
}
