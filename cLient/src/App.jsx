import { Navigate, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import AdminBillingPage from './pages/admin/billing/AdminBillingPage';
import AdminDashboardPage from './pages/admin/dashboard/AdminDashboardPage';
import AdminProductsPage from './pages/admin/products/AdminProductsPage';
import AdminReviewsPage from './pages/admin/reviews/AdminReviewsPage';
import AdminStoriesPage from './pages/admin/stories/AdminStoriesPage';
import AdminEstimationsPage from './pages/admin/estimations/AdminEstimationsPage';
import AdminCustomersPage from './pages/admin/customers/AdminCustomersPage';
import CustomerCartPage from './pages/customer/cart/CustomerCartPage';
import CustomerDashboardPage from './pages/customer/dashboard/CustomerDashboardPage';
import CustomerQueryPage from './pages/customer/query/CustomerQueryPage';
import CustomerHelpCenterPage from './pages/customer/help-center/CustomerHelpCenterPage';
import CustomerProductsPage from './pages/customer/products/CustomerProductsPage';
import CustomerReviewsPage from './pages/customer/reviews/CustomerReviewsPage';
import CustomerSuccessStoriesPage from './pages/customer/success-stories/CustomerSuccessStoriesPage';
import LoginPage from './pages/login/LoginPage';

const App = () => (
  <Routes>
    <Route path="/" element={<LoginPage />} />

    <Route
      path="/customer/dashboard"
      element={
        <ProtectedRoute role="customer">
          <CustomerDashboardPage />
        </ProtectedRoute>
      }
    />
    <Route
      path="/customer/products"
      element={
        <ProtectedRoute role="customer">
          <CustomerProductsPage />
        </ProtectedRoute>
      }
    />
    <Route
      path="/customer/reviews"
      element={
        <ProtectedRoute role="customer">
          <CustomerReviewsPage />
        </ProtectedRoute>
      }
    />
    <Route
      path="/customer/success-stories"
      element={
        <ProtectedRoute role="customer">
          <CustomerSuccessStoriesPage />
        </ProtectedRoute>
      }
    />
    <Route
      path="/customer/help-center"
      element={
        <ProtectedRoute role="customer">
          <CustomerHelpCenterPage />
        </ProtectedRoute>
      }
    />
    <Route
      path="/customer/query-section"
      element={
        <ProtectedRoute role="customer">
          <CustomerQueryPage />
        </ProtectedRoute>
      }
    />
    <Route
      path="/customer/products/:id"
      element={
        <ProtectedRoute role="customer">
          <CustomerQueryPage />
        </ProtectedRoute>
      }
    />
    <Route path="/customer" element={<Navigate to="/customer/dashboard" replace />} />
    <Route
      path="/customer/cart"
      element={
        <ProtectedRoute role="customer">
          <CustomerCartPage />
        </ProtectedRoute>
      }
    />

    <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
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
      path="/admin/reviews"
      element={
        <ProtectedRoute role="admin">
          <AdminReviewsPage />
        </ProtectedRoute>
      }
    />
    <Route
      path="/admin/stories"
      element={
        <ProtectedRoute role="admin">
          <AdminStoriesPage />
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
      path="/admin/customers"
      element={
        <ProtectedRoute role="admin">
          <AdminCustomersPage />
        </ProtectedRoute>
      }
    />

    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
);

export default App;
