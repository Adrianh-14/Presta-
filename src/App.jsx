import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { AuthProvider, useAuth } from './context/AuthContext';
import EntryChoice from './pages/EntryChoice';
import AdminLayout from './pages/admin/Layout';
import Dashboard from './pages/admin/Dashboard';
import Clientes from './pages/admin/Clientes';
import Prestamos from './pages/admin/Prestamos';
import Solicitudes from './pages/admin/Solicitudes';
import Solicitud from './pages/client/Solicitud';
import SolicitudDecision from './pages/client/SolicitudDecision';
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
import CollectorRouteMap from './pages/cobrador/RouteMap';
import VisitForm from './pages/cobrador/VisitForm';
import CollectorProfile from './pages/cobrador/Profile';
import PagoQR from './pages/portal/PagoQR';
import PortalPayments from './pages/portal/Payments';
import PortalLoanRecord from './pages/portal/LoanRecord';
import Mora from './pages/admin/Mora';
import Configuracion from './pages/admin/Configuracion';
import LocationConsent from './pages/portal/LocationConsent';
import CollectorRoutes from './pages/admin/CollectorRoutes';
import Landing from './pages/Landing';
import ClientProfile from './pages/portal/Profile';
import ProfileReviews from './pages/admin/ProfileReviews';
import { portalService } from './services/portalService';
import SessionExpiryGuard from './components/SessionExpiryGuard';

const MOBILE_PORTAL_KEY = 'bonexa.mobilePortal';
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

function ClientProfileGate({ children }) {
  const location = useLocation();
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState('loading');
  useEffect(() => {
    let active = true;
    portalService.getProfileStatus().then((status) => {
      if (active) setState(status.required ? 'required' : 'current');
    }).catch(() => { if (active) setState('error'); });
    return () => { active = false; };
  }, [location.pathname, attempt]);
  if (location.pathname === '/portal/perfil') return children;
  if (state === 'loading') return <div className="flex min-h-[60vh] items-center justify-center text-slate-500" role="status">Verificando actualización de datos…</div>;
  if (state === 'error') return <div className="m-auto max-w-lg rounded-12 border border-red-200 bg-white p-6 text-center"><p className="font-semibold text-navy-800">No pudimos verificar tu perfil</p><p className="mt-2 text-sm text-slate-500">Comprueba tu conexión e intenta de nuevo.</p><button type="button" onClick={() => { setState('loading'); setAttempt((value) => value + 1); }} className="mt-4 rounded-8 bg-accent-500 px-4 py-2 font-semibold text-navy-900">Reintentar</button></div>;
  if (state === 'required') return <Navigate to="/portal/perfil" replace state={{ from: location.pathname }} />;
  return children;
}

function CollectorRoute({ children }) {
  const { isAuthenticated, user, loading } = useAuth();
  if (loading) return <div className="flex h-screen items-center justify-center text-slate-500" role="status" aria-live="polite">Restaurando sesión…</div>;
  if (isNativeApp() && localStorage.getItem(MOBILE_PORTAL_KEY) === 'client') return <Navigate to="/portal/login" replace />;
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
  if (!isNativeApp()) return <Landing />;
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
      <Route path="/solicitud/decision" element={<SolicitudDecision />} />
      <Route path="/admin" element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
        <Route index element={<Dashboard />} />
        <Route path="clientes" element={<Clientes />} />
        <Route path="prestamos" element={<Prestamos />} />
        <Route path="nuevo-prestamo" element={<NuevoPrestamo />} />
        <Route path="solicitudes" element={<Solicitudes />} />
        <Route path="mora" element={<Mora />} />
        <Route path="configuracion" element={<Configuracion />} />
        <Route path="cobradores" element={<Cobradores />} />
        <Route path="cobradores/rutas" element={<CollectorRoutes />} />
        <Route path="gastos" element={<Gastos />} />
        <Route path="garantias" element={<Garantias />} />
        <Route path="inversiones" element={<Inversiones />} />
        <Route path="actualizaciones-perfil" element={<ProfileReviews />} />
      </Route>
      <Route path="/cobrador/login" element={<WorkLoginRoute><CollectorLogin /></WorkLoginRoute>} />
      <Route path="/cobrador" element={<CollectorRoute><CollectorLayout /></CollectorRoute>}>
        <Route index element={<CollectorDashboard />} />
        <Route path="cobros" element={<CollectorCollections />} />
        <Route path="ruta" element={<CollectorRouteMap />} />
        <Route path="perfil" element={<CollectorProfile />} />
        <Route path="cobros/:id" element={<VisitForm />} />
      </Route>
      <Route path="/portal/login" element={<ClientLoginRoute><PortalLogin /></ClientLoginRoute>} />
      <Route path="/portal/pago-qr" element={<ClientLoginRoute><PagoQR /></ClientLoginRoute>} />
      <Route path="/portal" element={<ClientRoute><PortalLayout /></ClientRoute>}>
        <Route index element={<ClientProfileGate><PortalDashboard /></ClientProfileGate>} />
        <Route path="perfil" element={<ClientProfile />} />
        <Route path="pagos" element={<ClientProfileGate><PortalPayments /></ClientProfileGate>} />
        <Route path="record" element={<ClientProfileGate><PortalLoanRecord /></ClientProfileGate>} />
        <Route path="prestamo/:id" element={<ClientProfileGate><PortalLoanDetail /></ClientProfileGate>} />
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
        <SessionExpiryGuard />
        <AppRoutes />
      </AuthProvider>
    </Router>
  );
}

export default App;
