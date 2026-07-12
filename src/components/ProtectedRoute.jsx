import { Navigate } from 'react-router-dom';
import { useAuth } from '../utils/AuthContext';

const ProtectedRoute = ({ role, children }) => {
  const { session } = useAuth();

  if (!session) {
    return <Navigate to="/" replace />;
  }

  if (role && session.role !== role) {
    return <Navigate to={session.role === 'admin' ? '/admin/dashboard' : '/customer/products'} replace />;
  }

  return children;
};

export default ProtectedRoute;
