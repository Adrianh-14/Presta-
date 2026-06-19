import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AdminLayout from './pages/admin/Layout';
import Dashboard from './pages/admin/Dashboard';
import Clientes from './pages/admin/Clientes';
import Prestamos from './pages/admin/Prestamos';
import Solicitudes from './pages/admin/Solicitudes';
import Solicitud from './pages/client/Solicitud';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="clientes" element={<Clientes />} />
          <Route path="prestamos" element={<Prestamos />} />
          <Route path="solicitudes" element={<Solicitudes />} />
        </Route>
        <Route path="/solicitud" element={<Solicitud />} />
        <Route path="/" element={<Navigate to="/admin" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
