import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { AppLayout } from './components/layout/AppLayout';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { PartsPage } from './pages/PartsPage';
import { ConfigurationsPage } from './pages/ConfigurationsPage';
import { ConfigurationDetailPage } from './pages/ConfigurationDetailPage';
import { PriceCalculatorPage } from './pages/PriceCalculatorPage';
import { AdminPage } from './pages/AdminPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30_000, refetchOnWindowFocus: false },
  },
});

function LoginRoute() {
  const { user } = useAuth();
  if (user) return <Navigate to="/" replace />;
  return <LoginPage />;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginRoute />} />

            <Route
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/" element={<DashboardPage />} />
              <Route path="/parts" element={<PartsPage />} />
              <Route path="/configurations" element={<ConfigurationsPage />} />
              <Route path="/configurations/:id" element={<ConfigurationDetailPage />} />
              <Route path="/calculator" element={<PriceCalculatorPage />} />
              <Route
                path="/admin"
                element={
                  <ProtectedRoute allowedRoles={['ADMIN']}>
                    <AdminPage />
                  </ProtectedRoute>
                }
              />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}
