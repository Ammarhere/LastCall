import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';

export default function ImpactPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-impact'],
    queryFn:  () => api.get('/admin/impact').then((r) => r.data.data),
  });

  const stats = [
    { icon: '🍱', label: 'Meals Saved from Waste',  value: data?.mealsSaved?.toLocaleString() ?? '0',      color: '#16A34A' },
    { icon: '🌿', label: 'CO₂ Prevented (kg)',       value: Number(data?.co2SavedKg ?? 0).toFixed(1),       color: '#059669' },
    { icon: '🛍️', label: 'Bags Rescued',             value: data?.bagsSaved?.toLocaleString() ?? '0',       color: '#3b82f6' },
    { icon: '🏪', label: 'Partner Restaurants',      value: data?.partnerCount?.toLocaleString() ?? '0',    color: '#f59e0b' },
    { icon: '👥', label: 'Active Customers',          value: data?.customerCount?.toLocaleString() ?? '0',  color: '#8b5cf6' },
  ];

  return (
    <div className="p-8">
      <h1 className="text-2xl font-black text-gray-900 mb-2">🌍 Platform Impact</h1>
      <p className="text-gray-500 text-sm mb-8">Last Call's contribution to reducing food waste in Pakistan</p>

      {isLoading ? <div className="text-center text-gray-400 py-20">Loading...</div> : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {stats.map((s) => (
            <div key={s.label} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="text-4xl mb-4">{s.icon}</div>
              <div className="text-4xl font-black mb-1" style={{ color: s.color }}>{s.value}</div>
              <div className="text-sm text-gray-500 font-medium">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-8 bg-gradient-to-br from-green-600 to-green-800 rounded-2xl p-8 text-white">
        <h2 className="text-xl font-bold mb-3">Why it matters</h2>
        <p className="text-green-100 leading-relaxed">
          Pakistan wastes approximately 40% of its food supply, costing the economy over Rs. 1 trillion annually.
          Every bag sold through Last Call is one less bag heading to a landfill, one less family going hungry, and
          one step toward a more sustainable Pakistan.
        </p>
      </div>
    </div>
  );
}
