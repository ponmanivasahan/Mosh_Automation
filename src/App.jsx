import { Navigate, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import AdminBillingPage from './pages/admin/billing/AdminBillingPage';
import AdminDashboardPage from './pages/admin/dashboard/AdminDashboardPage';
import AdminEstimationsPage from './pages/admin/estimations/AdminEstimationsPage';
import AdminNotificationsPage from './pages/admin/notifications/AdminNotificationsPage';
import AdminProductsPage from './pages/admin/products/AdminProductsPage';
import CustomerCartPage from './pages/customer/cart/CustomerCartPage';
import CustomerEstimatePage from './pages/customer/estimate/CustomerEstimatePage';
import CustomerProductsPage from './pages/customer/products/CustomerProductsPage';
import LoginPage from './pages/login/LoginPage';

const App = () => (
  <Routes>
    <Route path="/" element={<LoginPage />} />

    <Route
      path="/customer/dashboard"
      element={
        <ProtectedRoute role="customer">
          <CustomerProductsPage />
        </ProtectedRoute>
      }
    />
    <Route
      path="/customer/products"
      element={<Navigate to="/customer/dashboard" replace />}
    />
    <Route
      path="/customer/products/:id"
      element={
        <ProtectedRoute role="customer">
          <CustomerEstimatePage />
        </ProtectedRoute>
      }
    />
    <Route
      path="/customer/cart"
      element={
        <ProtectedRoute role="customer">
          <CustomerCartPage />
        </ProtectedRoute>
      }
    />

    <Route
      path="/admin/dashboard"
      element={
        <ProtectedRoute role="admin">
          <AdminDashboardPage />
        </ProtectedRoute>
      }
    />
    <Route
      path="/admin/products"
      element={
        <ProtectedRoute role="admin">
          <AdminProductsPage />
        </ProtectedRoute>
      }
    />
    <Route
      path="/admin/billing"
      element={
        <ProtectedRoute role="admin">
          <AdminBillingPage />
        </ProtectedRoute>
      }
    />
    <Route
      path="/admin/estimations"
      element={
        <ProtectedRoute role="admin">
          <AdminEstimationsPage />
        </ProtectedRoute>
      }
    />
    <Route
      path="/admin/notifications"
      element={
        <ProtectedRoute role="admin">
          <AdminNotificationsPage />
        </ProtectedRoute>
      }
    />

    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
);

export default App;
