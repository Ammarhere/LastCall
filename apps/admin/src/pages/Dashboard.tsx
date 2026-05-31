import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { formatPKR } from '@lastcall/shared';

function KPI({ label, value, sub, color }: { label: string; value: string; sub?: string; color: string }) {
  return (
    <div className={`bg-white rounded-2xl p-6 border-l-4 shadow-sm`} style={{ borderLeftColor: color }}>
      <p className="text-sm text-gray-500 font-medium">{label}</p>
      <p className="text-3xl font-black text-gray-900 mt-1">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

export default function DashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn:  () => api.get('/admin/stats').then((r) => r.data.data),
    refetchInterval: 30000, // 30s — reduced from 60s for fresher data
  });

  const { data: impact } = useQuery({
    queryKey: ['admin-impact'],
    queryFn:  () => api.get('/admin/impact').then((r) => r.data.data),
  });

  if (isLoading) return <div className="p-8 text-center text-gray-400">Loading dashboard...</div>;

  return (
    <div className="p-8">
      <h1 className="text-2xl font-black text-gray-900 mb-2">Dashboard</h1>
      <p className="text-gray-500 text-sm mb-8">Platform overview — Last Call Pakistan</p>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <KPI label="Today's Orders"   value={String(data?.todayOrders  ?? 0)} sub={`${formatPKR(data?.todayGmv ?? 0)} GMV today`} color="#3b82f6" />
        <KPI label="Total GMV"        value={formatPKR(data?.gmv        ?? 0)} sub={`${formatPKR(data?.revenue ?? 0)} commission`} color="#16A34A" />
        <KPI label="Active Partners"  value={String(data?.totalPartners  ?? 0)} sub={`${data?.pendingPartners ?? 0} pending approval`} color="#f59e0b" />
        <KPI label="Customers"        value={String(data?.totalUsers    ?? 0)} color="#8b5cf6" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <KPI label="Total Orders"     value={String(data?.totalOrders ?? 0)}     color="#6b7280" />
        <KPI label="Active Bags"      value={String(data?.activeBags ?? 0)}       color="#ec4899" />
        <KPI label="Pending Approvals" value={String(data?.pendingPartners ?? 0)} color="#ef4444" />
        <KPI label="Commission Earned" value={formatPKR(data?.revenue ?? 0)}     color="#14b8a6" />
      </div>

      {/* Impact Stats */}
      {impact && (
        <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-2xl p-6 text-white">
          <h2 className="text-lg font-bold mb-4">🌍 Platform Impact</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            <div><p className="text-3xl font-black">{impact.mealsSaved?.toLocaleString()}</p><p className="text-green-200 text-sm mt-1">Meals Saved</p></div>
            <div><p className="text-3xl font-black">{Number(impact.co2SavedKg).toFixed(0)} kg</p><p className="text-green-200 text-sm mt-1">CO₂ Prevented</p></div>
            <div><p className="text-3xl font-black">{impact.partnerCount?.toLocaleString()}</p><p className="text-green-200 text-sm mt-1">Active Partners</p></div>
            <div><p className="text-3xl font-black">{impact.customerCount?.toLocaleString()}</p><p className="text-green-200 text-sm mt-1">Happy Customers</p></div>
          </div>
        </div>
      )}
    </div>
  );
}
