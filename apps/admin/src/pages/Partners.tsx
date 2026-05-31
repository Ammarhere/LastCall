import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';

const STATUS_COLORS: Record<string, string> = {
  APPROVED: 'bg-green-100 text-green-700',
  PENDING:  'bg-yellow-100 text-yellow-700',
  SUSPENDED:'bg-red-100 text-red-700',
};

export default function PartnersPage() {
  const [statusFilter, setStatusFilter] = useState('');
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-partners', statusFilter],
    queryFn:  () => api.get('/admin/partners', { params: statusFilter ? { status: statusFilter } : {} }).then((r) => r.data.data),
  });

  const { mutate: changeStatus } = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.patch(`/admin/partners/${id}/status`, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-partners'] }),
  });

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Partners</h1>
          <p className="text-gray-500 text-sm mt-1">{data?.length ?? 0} partners</p>
        </div>
        <div className="flex gap-2">
          {['', 'PENDING', 'APPROVED', 'SUSPENDED'].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${statusFilter === s ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              {s || 'All'}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="text-center text-gray-400 py-20">Loading...</div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['Business', 'Category', 'City', 'Rating', 'Orders', 'Commission', 'Status', 'Actions'].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {(data ?? []).map((p: any) => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="font-semibold text-gray-900 text-sm">{p.businessName}</div>
                    <div className="text-xs text-gray-400">{p.user?.phone}</div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{p.category}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{p.city?.name}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">⭐ {p.rating?.toFixed(1)} ({p.reviewCount})</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{p._count?.orders ?? 0}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{p.commissionPct}%</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_COLORS[p.status] ?? ''}`}>{p.status}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      {p.status !== 'APPROVED'  && <button onClick={() => changeStatus({ id: p.id, status: 'APPROVED' })}  className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-semibold hover:bg-green-200">Approve</button>}
                      {p.status !== 'SUSPENDED' && <button onClick={() => changeStatus({ id: p.id, status: 'SUSPENDED' })} className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-semibold hover:bg-red-200">Suspend</button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {(!data || data.length === 0) && <p className="text-center text-gray-400 py-10">No partners found</p>}
        </div>
      )}
    </div>
  );
}
