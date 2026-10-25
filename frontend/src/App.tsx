import { Navigate, Route, Routes } from 'react-router-dom';
import { BrowserRouter } from 'react-router-dom';
import { getDefaultRoleRoute, ProtectedRoute } from './auth/ProtectedRoute';
import { useAuth } from './auth/AuthContext';
import LoginPage from './pages/Login';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import ChangePasswordPage from './pages/ChangePasswordPage';
import InvoicesPage from './pages/finance/InvoicesPage';
import InvoiceDetailPage from './pages/finance/InvoiceDetailPage';
import InvoiceFormPage from './pages/finance/InvoiceFormPage';
import ClientsPage from './pages/finance/ClientsPage';
import ClientFormPage from './pages/finance/ClientFormPage';
import DeliveriesPage from './pages/admin/DeliveriesPage';
import AvailableInvoicesPage from './pages/courier/AvailableInvoicesPage';
import MyDeliveriesPage from './pages/courier/MyDeliveriesPage';
import MyInvoicesPage from './pages/client/MyInvoicesPage';
import MyInvoiceDetailPage from './pages/client/MyInvoiceDetailPage';
import DesktopLayout from './layouts/DesktopLayout';
import './App.css';

function RootRedirect() {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div className="min-h-screen bg-paper px-4 py-8 text-ink">Loading...</div>;
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  return <Navigate to={getDefaultRoleRoute(user.role)} replace />;
}

function LoginRouteGate() {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div className="min-h-screen bg-paper px-4 py-8 text-ink">Loading...</div>;
  }

  if (isAuthenticated && user) {
    return <Navigate to={getDefaultRoleRoute(user.role)} replace />;
  }

  return <LoginPage />;
}

function CatchAllRoute() {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div className="min-h-screen bg-paper px-4 py-8 text-ink">Loading...</div>;
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  return <Navigate to={getDefaultRoleRoute(user.role)} replace />;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<RootRedirect />} />
        <Route path="/login" element={<LoginRouteGate />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />

        <Route
          path="/change-password"
          element={
            <ProtectedRoute allowedRoles={['Admin', 'Finance', 'Courier', 'Client']}>
              <DesktopLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<ChangePasswordPage />} />
        </Route>

        <Route
          path="/invoices"
          element={
            <ProtectedRoute allowedRoles={['Admin', 'Finance']}>
              <DesktopLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<InvoicesPage />} />
          <Route path="new" element={<InvoiceFormPage />} />
          <Route path=":id" element={<InvoiceDetailPage />} />
          <Route path=":id/edit" element={<InvoiceFormPage />} />
        </Route>

        <Route
          path="/clients"
          element={
            <ProtectedRoute allowedRoles={['Admin', 'Finance']}>
              <DesktopLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<ClientsPage />} />
          <Route path="new" element={<ClientFormPage />} />
          <Route path=":id/edit" element={<ClientFormPage />} />
        </Route>

        <Route
          path="/deliveries"
          element={
            <ProtectedRoute allowedRoles={['Admin']}>
              <DesktopLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<DeliveriesPage />} />
        </Route>

        <Route
          path="/courier"
          element={
            <ProtectedRoute allowedRoles={['Courier']}>
              <DesktopLayout />
            </ProtectedRoute>
          }
        >
          <Route path="available" element={<AvailableInvoicesPage />} />
          <Route path="my" element={<MyDeliveriesPage />} />
        </Route>

        <Route
          path="/my"
          element={
            <ProtectedRoute allowedRoles={['Client']}>
              <DesktopLayout />
            </ProtectedRoute>
          }
        >
          <Route path="invoices" element={<MyInvoicesPage />} />
          <Route path="invoices/:id" element={<MyInvoiceDetailPage />} />
        </Route>

        <Route path="*" element={<CatchAllRoute />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
