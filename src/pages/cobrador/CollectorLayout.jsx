import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import CollectorSidebar from './Layout';

export default function CollectorLayout() {
  return (
    <div className="flex min-h-screen bg-surface-canvas">
      <CollectorSidebar />
      <main className="flex-1 p-8">
        <Outlet />
      </main>
    </div>
  );
}
