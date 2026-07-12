import { Navigate, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import AdminBillingPage from './pages/AdminBillingPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import AdminEstimationsPage from './pages/AdminEstimationsPage';
import AdminNotificationsPage from './pages/AdminNotificationsPage';
import AdminProductsPage from './pages/AdminProductsPage';
import CustomerCartPage from './pages/CustomerCartPage';
import CustomerEstimatePage from './pages/CustomerEstimatePage';
import CustomerProductsPage from './pages/CustomerProductsPage';
import LoginPage from './pages/LoginPage';

const App = () => (
  <Routes>
    <Route path="/" element={<LoginPage />} />

    <Route
      path="/customer/products"
      element={
        <ProtectedRoute role="customer">
          <CustomerProductsPage />
        </ProtectedRoute>
      }
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
