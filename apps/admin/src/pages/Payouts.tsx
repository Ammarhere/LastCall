import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import { formatPKR } from '@lastcall/shared';

const STATUS_COLORS: Record<string, string> = {
  PENDING:    'bg-yellow-100 text-yellow-700',
  PROCESSING: 'bg-blue-100 text-blue-700',
  COMPLETED:  'bg-green-100 text-green-700',
  FAILED:     'bg-red-100 text-red-700',
};

export default function PayoutsPage() {
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-payouts'],
    queryFn:  () => api.get('/admin/payouts').then((r) => r.data.data),
  });

  const { mutate: updatePayout } = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.patch(`/admin/payouts/${id}`, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-payouts'] }),
  });

  const { mutate: runPayouts } = useMutation({
    mutationFn: () => api.post('/admin/payouts/run'),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-payouts'] });
      alert('Payout run triggered successfully!');
    },
  });

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Payouts</h1>
          <p className="text-gray-500 text-sm mt-1">Weekly partner settlements</p>
        </div>
        <button
          onClick={() => runPayouts()}
          className="bg-green-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-green-700"
        >
          ▶ Run Payout Now
        </button>
      </div>

      {isLoading ? <div className="text-center text-gray-400 py-20">Loading...</div> : (
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['Partner', 'Period', 'Orders', 'Gross', 'Commission', 'Net Payout', 'Status', 'Actions'].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {(data ?? []).map((p: any) => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-semibold text-gray-900">{p.partner?.businessName}</td>
                  <td className="px-4 py-3 text-xs text-gray-500">{new Date(p.periodStart).toLocaleDateString()} – {new Date(p.periodEnd).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{p.orderCount}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{formatPKR(p.grossAmount)}</td>
                  <td className="px-4 py-3 text-sm text-red-500">-{formatPKR(p.commissionDeducted)}</td>
                  <td className="px-4 py-3 text-sm font-bold text-green-700">{formatPKR(p.netAmount)}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_COLORS[p.status] ?? ''}`}>{p.status}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      {p.status === 'PENDING'    && <button onClick={() => updatePayout({ id: p.id, status: 'PROCESSING' })} className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-semibold hover:bg-blue-200">Process</button>}
                      {p.status === 'PROCESSING' && <button onClick={() => updatePayout({ id: p.id, status: 'COMPLETED' })}  className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-semibold hover:bg-green-200">Mark Paid</button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!data?.length && <p className="text-center text-gray-400 py-10">No payouts yet</p>}
        </div>
      )}
    </div>
  );
}
