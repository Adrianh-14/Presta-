import { Outlet } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import ProductGuide from '../../components/ProductGuide';

export default function Layout() {
  return (
    <div className="flex min-h-screen bg-surface-canvas">
      <Sidebar />
      <main className="min-w-0 flex-1 px-4 pb-8 pt-20 sm:px-6 md:p-8 lg:p-10">
        <div className="mx-auto w-full max-w-[1480px]"><Outlet /></div>
      </main>
      <ProductGuide />
    </div>
  );
}
