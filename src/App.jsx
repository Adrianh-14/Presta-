import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import AdminLayout from './pages/admin/Layout';
import Dashboard from './pages/admin/Dashboard';
import Clientes from './pages/admin/Clientes';
import Prestamos from './pages/admin/Prestamos';
import Solicitudes from './pages/admin/Solicitudes';
import Solicitud from './pages/client/Solicitud';
import Login from './pages/Login';

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center h-screen"><p>Cargando...</p></div>;
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

function PublicRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center h-screen"><p>Cargando...</p></div>;
  return isAuthenticated ? <Navigate to="/admin" replace /> : children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/solicitud" element={<Solicitud />} />
      <Route path="/admin" element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
        <Route index element={<Dashboard />} />
        <Route path="clientes" element={<Clientes />} />
        <Route path="prestamos" element={<Prestamos />} />
        <Route path="solicitudes" element={<Solicitudes />} />
      </Route>
      <Route path="/" element={<Navigate to="/admin" replace />} />
      <Route path="*" element={<Navigate to="/admin" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </Router>
  );
}

export default App;
