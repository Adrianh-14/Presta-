import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { AuthProvider, useAuth } from './context/AuthContext';
import EntryChoice from './pages/EntryChoice';
import AdminLayout from './pages/admin/Layout';
import Dashboard from './pages/admin/Dashboard';
import Clientes from './pages/admin/Clientes';
import Prestamos from './pages/admin/Prestamos';
import Solicitudes from './pages/admin/Solicitudes';
import Solicitud from './pages/client/Solicitud';
import NuevoPrestamo from './pages/admin/NuevoPrestamo';
import Login from './pages/Login';
import PasswordReset from './pages/PasswordReset';
import Register from './pages/Register';
import PortalLayout from './pages/portal/Layout';
import PortalDashboard from './pages/portal/Dashboard';
import PortalLoanDetail from './pages/portal/LoanDetail';
import PortalLogin from './pages/portal/Login';
import Cobradores from './pages/admin/Cobradores';
import Gastos from './pages/admin/Gastos';
import Garantias from './pages/admin/Garantias';
import Inversiones from './pages/admin/Inversiones';
import PlatformDashboard from './pages/platform/Dashboard';
import PlatformEmpresas from './pages/platform/Empresas';
import PlatformPlanes from './pages/platform/Planes';
import PlatformAuditoria from './pages/platform/Auditoria';
import PlatformSuscripciones from './pages/platform/Suscripciones';
import PlatformPromociones from './pages/platform/Promociones';
import CollectorLogin from './pages/cobrador/Login';
import CollectorLayout from './pages/cobrador/CollectorLayout';
import CollectorDashboard from './pages/cobrador/Dashboard';
import CollectorCollections from './pages/cobrador/Collections';
import VisitForm from './pages/cobrador/VisitForm';
import PagoQR from './pages/portal/PagoQR';
import PortalPayments from './pages/portal/Payments';
import Mora from './pages/admin/Mora';
import Configuracion from './pages/admin/Configuracion';
import LocationConsent from './pages/portal/LocationConsent';

const MOBILE_PORTAL_KEY = 'prestamoplus.mobilePortal';
const isNativeApp = () => Capacitor.isNativePlatform();

function ProtectedRoute({ children }) {
  const { isAuthenticated, user, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center h-screen" role="status" aria-live="polite"><p>Cargando...</p></div>;
  if (isNativeApp() && localStorage.getItem(MOBILE_PORTAL_KEY) === 'client') return <Navigate to="/portal/login" replace />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.role === 'Cobrador') return <Navigate to="/cobrador" replace />;
  if (['SuperAdmin', 'PlatformAdmin', 'AdministradorPlataforma'].includes(user?.role)) return <Navigate to="/plataforma" replace />;
  return children;
}

function PublicRoute({ children }) {
  const { isAuthenticated, user, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center h-screen" role="status" aria-live="polite"><p>Cargando...</p></div>;
  if (isNativeApp() && localStorage.getItem(MOBILE_PORTAL_KEY) === 'client') return <Navigate to="/portal/login" replace />;
  if (!isAuthenticated && localStorage.getItem('clientToken')) return <Navigate to="/portal" replace />;
  if (!isAuthenticated) return children;
  if (user?.role === 'Cobrador') return <Navigate to="/cobrador" replace />;
  if (['SuperAdmin', 'PlatformAdmin', 'AdministradorPlataforma'].includes(user?.role)) return <Navigate to="/plataforma" replace />;
  return <Navigate to="/admin" replace />;
}

function ClientRoute({ children }) {
  if (isNativeApp() && localStorage.getItem(MOBILE_PORTAL_KEY) === 'work') return <Navigate to="/login" replace />;
  const token = localStorage.getItem('clientToken');
  if (!token) return <Navigate to="/portal/login" replace />;
  return children;
}

function CollectorRoute({ children }) {
  if (isNativeApp() && localStorage.getItem(MOBILE_PORTAL_KEY) === 'client') return <Navigate to="/portal/login" replace />;
  const { isAuthenticated, user } = useAuth();
  if (!isAuthenticated) return <Navigate to="/cobrador/login" replace />;
  if (user?.role !== 'Cobrador') return <Navigate to="/login" replace />;
  return children;
}

function PlatformRoute({ children }) {
  const { isAuthenticated, user, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center h-screen" role="status" aria-live="polite"><p>Cargando...</p></div>;
  if (isNativeApp() && localStorage.getItem(MOBILE_PORTAL_KEY) === 'client') return <Navigate to="/portal/login" replace />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!['SuperAdmin', 'PlatformAdmin', 'AdministradorPlataforma'].includes(user?.role)) return <Navigate to="/admin" replace />;
  return children;
}

function WorkLoginRoute({ children }) {
  if (isNativeApp() && localStorage.getItem(MOBILE_PORTAL_KEY) === 'client') return <Navigate to="/portal/login" replace />;
  return children;
}

function ClientLoginRoute({ children }) {
  if (isNativeApp() && localStorage.getItem(MOBILE_PORTAL_KEY) === 'work') return <Navigate to="/login" replace />;
  return children;
}

function EntryGate() {
  const choice = localStorage.getItem(MOBILE_PORTAL_KEY);
  if (!isNativeApp()) return <Navigate to="/admin" replace />;
  if (!choice) return <EntryChoice onSelect={(value) => { localStorage.setItem(MOBILE_PORTAL_KEY, value); window.location.replace(value === 'client' ? '/portal/login' : '/login'); }} />;
  return <Navigate to={choice === 'client' ? '/portal/login' : '/login'} replace />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/plataforma" element={<PlatformRoute><AdminLayout /></PlatformRoute>}>
        <Route index element={<PlatformDashboard />} />
        <Route path="empresas" element={<PlatformEmpresas />} />
        <Route path="planes" element={<PlatformPlanes />} />
        <Route path="suscripciones" element={<PlatformSuscripciones />} />
        <Route path="promociones" element={<PlatformPromociones />} />
        <Route path="auditoria" element={<PlatformAuditoria />} />
      </Route>
      <Route path="/login" element={<WorkLoginRoute><PublicRoute><Login /></PublicRoute></WorkLoginRoute>} />
      <Route path="/recuperar-contrasena" element={<PasswordReset />} />
      <Route path="/registro" element={<PublicRoute><Register /></PublicRoute>} />
      <Route path="/solicitud" element={<Solicitud />} />
      <Route path="/admin" element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
        <Route index element={<Dashboard />} />
        <Route path="clientes" element={<Clientes />} />
        <Route path="prestamos" element={<Prestamos />} />
        <Route path="nuevo-prestamo" element={<NuevoPrestamo />} />
        <Route path="solicitudes" element={<Solicitudes />} />
        <Route path="mora" element={<Mora />} />
        <Route path="configuracion" element={<Configuracion />} />
        <Route path="cobradores" element={<Cobradores />} />
        <Route path="gastos" element={<Gastos />} />
        <Route path="garantias" element={<Garantias />} />
        <Route path="inversiones" element={<Inversiones />} />
      </Route>
      <Route path="/cobrador/login" element={<WorkLoginRoute><CollectorLogin /></WorkLoginRoute>} />
      <Route path="/cobrador" element={<CollectorRoute><CollectorLayout /></CollectorRoute>}>
        <Route index element={<CollectorDashboard />} />
        <Route path="cobros" element={<CollectorCollections />} />
        <Route path="cobros/:id" element={<VisitForm />} />
      </Route>
      <Route path="/portal/login" element={<ClientLoginRoute><PortalLogin /></ClientLoginRoute>} />
      <Route path="/portal/pago-qr" element={<ClientLoginRoute><PagoQR /></ClientLoginRoute>} />
      <Route path="/portal" element={<ClientRoute><PortalLayout /></ClientRoute>}>
        <Route index element={<PortalDashboard />} />
        <Route path="pagos" element={<PortalPayments />} />
        <Route path="prestamo/:id" element={<PortalLoanDetail />} />
        <Route path="ubicacion" element={<LocationConsent />} />
      </Route>
      <Route path="/" element={<EntryGate />} />
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
