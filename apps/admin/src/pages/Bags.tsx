import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';
import { formatPKR } from '@lastcall/shared';

export default function BagsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-bags'],
    queryFn:  () => api.get('/bags', { params: { limit: 50 } }).then((r) => r.data.data),
  });

  const STATUS_COLORS: Record<string, string> = {
    AVAILABLE: 'bg-green-100 text-green-700',
    SOLD_OUT:  'bg-yellow-100 text-yellow-700',
    CANCELLED: 'bg-red-100 text-red-700',
    DRAFT:     'bg-gray-100 text-gray-600',
    EXPIRED:   'bg-gray-100 text-gray-400',
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-black text-gray-900 mb-2">Bags</h1>
      <p className="text-gray-500 text-sm mb-6">{data?.length ?? 0} bags listed</p>

      {isLoading ? <div className="text-center text-gray-400 py-20">Loading...</div> : (
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['Bag', 'Partner', 'Price', 'Qty Left', 'Pickup Date', 'Status'].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {(data ?? []).map((b: any) => (
                <tr key={b.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-semibold text-gray-900">{b.title}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{b.partner?.businessName}</td>
                  <td className="px-4 py-3 text-sm font-bold text-green-700">{formatPKR(b.discountedPrice)}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{b.quantityLeft}/{b.quantityTotal}</td>
                  <td className="px-4 py-3 text-xs text-gray-400">{new Date(b.pickupDate).toLocaleDateString('en-PK')}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_COLORS[b.status] ?? ''}`}>{b.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!data?.length && <p className="text-center text-gray-400 py-10">No bags</p>}
        </div>
      )}
    </div>
  );
}
