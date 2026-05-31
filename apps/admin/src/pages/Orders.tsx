import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';
import { formatPKR } from '@lastcall/shared';

const STATUS_COLORS: Record<string, string> = {
  CONFIRMED: 'bg-blue-100 text-blue-700',
  READY:     'bg-yellow-100 text-yellow-700',
  PICKED_UP: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-red-100 text-red-700',
  REFUNDED:  'bg-purple-100 text-purple-700',
};

export default function OrdersPage() {
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-orders', statusFilter, page],
    queryFn:  () => api.get('/admin/orders', { params: { status: statusFilter || undefined, page, limit: 50 } }).then((r) => r.data),
  });

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Orders</h1>
          <p className="text-gray-500 text-sm mt-1">{data?.total ?? 0} total orders</p>
        </div>
        <div className="flex gap-2">
          {['', 'CONFIRMED', 'READY', 'PICKED_UP', 'CANCELLED'].map((s) => (
            <button key={s} onClick={() => { setStatusFilter(s); setPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${statusFilter === s ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
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
                {['Customer', 'Partner', 'Bag', 'Amount', 'Payment', 'Status', 'Date'].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {(data?.data ?? []).map((o: any) => (
                <tr key={o.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="text-sm font-semibold text-gray-900">{o.user?.name ?? '-'}</div>
                    <div className="text-xs text-gray-400">{o.user?.phone}</div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{o.partner?.businessName}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{o.bag?.title}</td>
                  <td className="px-4 py-3 text-sm font-bold text-green-700">{formatPKR(o.totalAmount)}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{o.paymentMethod}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_COLORS[o.orderStatus] ?? 'bg-gray-100 text-gray-600'}`}>{o.orderStatus}</span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-400">{new Date(o.createdAt).toLocaleDateString('en-PK')}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {(!data?.data?.length) && <p className="text-center text-gray-400 py-10">No orders</p>}

          {/* Pagination */}
          <div className="flex justify-between items-center px-4 py-3 border-t border-gray-100">
            <p className="text-sm text-gray-500">Showing {((page - 1) * 50) + 1}–{Math.min(page * 50, data?.total ?? 0)} of {data?.total}</p>
            <div className="flex gap-2">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                className="px-3 py-1 rounded bg-gray-100 text-sm disabled:opacity-40">← Prev</button>
              <button onClick={() => setPage((p) => p + 1)} disabled={page * 50 >= (data?.total ?? 0)}
                className="px-3 py-1 rounded bg-gray-100 text-sm disabled:opacity-40">Next →</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
