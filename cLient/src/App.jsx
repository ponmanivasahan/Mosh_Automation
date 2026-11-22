import { useEffect } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import { initAnalytics, trackPageView } from './utils/analytics';

// Public Pages (SEO & Organic Discovery)
import HomePage from './pages/public/HomePage';
import ProductListingPage from './pages/public/ProductListingPage';
import ProductDetailPage from './pages/public/ProductDetailPage';
import SolutionPage from './pages/public/SolutionPage';
import BlogIndexPage from './pages/public/BlogIndexPage';
import BlogPostPage from './pages/public/BlogPostPage';
import NotFoundPage from './pages/public/NotFoundPage';

// Portal & Admin Pages
import AdminBillingPage from './pages/admin/billing/AdminBillingPage';
import AdminInvoicesPage from './pages/admin/invoices/AdminInvoicesPage';
import AdminDashboardPage from './pages/admin/dashboard/AdminDashboardPage';
import AdminProductsPage from './pages/admin/products/AdminProductsPage';
import AdminReviewsPage from './pages/admin/reviews/AdminReviewsPage';
import AdminStoriesPage from './pages/admin/stories/AdminStoriesPage';
import AdminEstimationsPage from './pages/admin/estimations/AdminEstimationsPage';
import AdminCustomersPage from './pages/admin/customers/AdminCustomersPage';
import AdminNotificationsPage from './pages/admin/notifications/AdminNotificationsPage';
import AdminSettingsPage from './pages/admin/settings/AdminSettingsPage';
import CustomerCartPage from './pages/customer/cart/CustomerCartPage';
import CustomerDashboardPage from './pages/customer/dashboard/CustomerDashboardPage';
import CustomerQueryPage from './pages/customer/query/CustomerQueryPage';
import CustomerHelpCenterPage from './pages/customer/help-center/CustomerHelpCenterPage';
import CustomerProductsPage from './pages/customer/products/CustomerProductsPage';
import CustomerReviewsPage from './pages/customer/reviews/CustomerReviewsPage';
import CustomerSuccessStoriesPage from './pages/customer/success-stories/CustomerSuccessStoriesPage';
import LoginPage from './pages/login/LoginPage';

const App = () => {
  const location = useLocation();

  useEffect(() => {
    initAnalytics();
  }, []);

  useEffect(() => {
    trackPageView(location.pathname);
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <Routes>
      {/* Public Routes (SEO & Indexing) */}
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/products" element={<ProductListingPage />} />
      <Route path="/products/:slugOrId" element={<ProductDetailPage />} />
      <Route path="/solutions/:slug" element={<SolutionPage />} />
      <Route path="/blog" element={<BlogIndexPage />} />
      <Route path="/blog/:slug" element={<BlogPostPage />} />

      {/* Customer Portal (Protected) */}
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

      {/* Admin Portal (Protected) */}
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
        path="/admin/invoices"
        element={
          <ProtectedRoute role="admin">
            <AdminInvoicesPage />
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
      <Route
        path="/admin/notifications"
        element={
          <ProtectedRoute role="admin">
            <AdminNotificationsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/settings"
        element={
          <ProtectedRoute role="admin">
            <AdminSettingsPage />
          </ProtectedRoute>
        }
      />

      {/* 404 Not Found Page */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};

export default App;
