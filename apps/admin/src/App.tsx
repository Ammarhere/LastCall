import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAdminAuth } from './lib/auth';
import LoginPage     from './pages/Login';
import DashboardPage from './pages/Dashboard';
import PartnersPage  from './pages/Partners';
import OrdersPage    from './pages/Orders';
import UsersPage     from './pages/Users';
import BagsPage      from './pages/Bags';
import PayoutsPage   from './pages/Payouts';
import ImpactPage    from './pages/Impact';
import Layout        from './components/Layout';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { token } = useAdminAuth();
  return token ? <>{children}</> : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/*" element={
          <ProtectedRoute>
            <Layout>
              <Routes>
                <Route path="/"          element={<DashboardPage />} />
                <Route path="/partners"  element={<PartnersPage />} />
                <Route path="/orders"    element={<OrdersPage />} />
                <Route path="/users"     element={<UsersPage />} />
                <Route path="/bags"      element={<BagsPage />} />
                <Route path="/payouts"   element={<PayoutsPage />} />
                <Route path="/impact"    element={<ImpactPage />} />
                <Route path="*"          element={<Navigate to="/" replace />} />
              </Routes>
            </Layout>
          </ProtectedRoute>
        } />
      </Routes>
    </BrowserRouter>
  );
}
