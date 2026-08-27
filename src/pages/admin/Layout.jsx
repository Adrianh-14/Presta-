import { Outlet } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';

export default function Layout() {
  return (
    <div className="flex min-h-screen flex-col md:flex-row bg-surface-canvas">
      <Sidebar />
      <main className="flex-1 min-w-0 p-4 sm:p-6 md:p-8">
        <Outlet />
      </main>
    </div>
  );
}
