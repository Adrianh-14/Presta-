import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import AdminLayout from './pages/admin/Layout';
import Dashboard from './pages/admin/Dashboard';
import Clientes from './pages/admin/Clientes';
import Prestamos from './pages/admin/Prestamos';
import Solicitudes from './pages/admin/Solicitudes';
import Solicitud from './pages/client/Solicitud';
import NuevoPrestamo from './pages/admin/NuevoPrestamo';
import Login from './pages/Login';
import PortalLayout from './pages/portal/Layout';
import PortalDashboard from './pages/portal/Dashboard';
import PortalLoanDetail from './pages/portal/LoanDetail';
import PortalLogin from './pages/portal/Login';
import Cobradores from './pages/admin/Cobradores';
import Gastos from './pages/admin/Gastos';
import CollectorLogin from './pages/cobrador/Login';
import CollectorLayout from './pages/cobrador/CollectorLayout';
import CollectorDashboard from './pages/cobrador/Dashboard';
import CollectorCollections from './pages/cobrador/Collections';
import VisitForm from './pages/cobrador/VisitForm';
import PagoQR from './pages/portal/PagoQR';
import PortalPayments from './pages/portal/Payments';

function ProtectedRoute({ children }) {
  const { isAuthenticated, user, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center h-screen"><p>Cargando...</p></div>;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.role === 'Cobrador') return <Navigate to="/cobrador" replace />;
  return children;
}

function PublicRoute({ children }) {
  const { isAuthenticated, user, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center h-screen"><p>Cargando...</p></div>;
  if (!isAuthenticated) return children;
  if (user?.role === 'Cobrador') return <Navigate to="/cobrador" replace />;
  return <Navigate to="/admin" replace />;
}

function ClientRoute({ children }) {
  const token = localStorage.getItem('clientToken');
  if (!token) return <Navigate to="/portal/login" replace />;
  return children;
}

function CollectorRoute({ children }) {
  const { isAuthenticated, user } = useAuth();
  if (!isAuthenticated) return <Navigate to="/cobrador/login" replace />;
  if (user?.role !== 'Cobrador') return <Navigate to="/login" replace />;
  return children;
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
        <Route path="nuevo-prestamo" element={<NuevoPrestamo />} />
        <Route path="solicitudes" element={<Solicitudes />} />
        <Route path="cobradores" element={<Cobradores />} />
        <Route path="gastos" element={<Gastos />} />
      </Route>
      <Route path="/cobrador/login" element={<CollectorLogin />} />
      <Route path="/cobrador" element={<CollectorRoute><CollectorLayout /></CollectorRoute>}>
        <Route index element={<CollectorDashboard />} />
        <Route path="cobros" element={<CollectorCollections />} />
        <Route path="cobros/:id" element={<VisitForm />} />
      </Route>
      <Route path="/portal/login" element={<PortalLogin />} />
      <Route path="/portal/pago-qr" element={<PagoQR />} />
      <Route path="/portal" element={<ClientRoute><PortalLayout /></ClientRoute>}>
        <Route index element={<PortalDashboard />} />
        <Route path="pagos" element={<PortalPayments />} />
        <Route path="prestamo/:id" element={<PortalLoanDetail />} />
      </Route>
      <Route path="/" element={<Navigate to="/admin" replace />} />
      <Route path="*" element={<Navigate to="/admin" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </Router>
  );
}

export default App;
