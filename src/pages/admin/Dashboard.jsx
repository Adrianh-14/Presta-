export default function Dashboard() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Total Préstamos</h3>
          <p className="text-2xl font-bold text-primary-600">245</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Monto Total</h3>
          <p className="text-2xl font-bold text-primary-600">$1,250,000</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Clientes Activos</h3>
          <p className="text-2xl font-bold text-primary-600">182</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Solicitudes Pendientes</h3>
          <p className="text-2xl font-bold text-primary-600">12</p>
        </div>
      </div>
    </div>
  );
}
