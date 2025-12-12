import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { storageService } from '../services/storage';
import { Booking, Equipment } from '../types';
import { DollarSign, Users, Activity, Package, Plus } from 'lucide-react';

const AdminPage: React.FC = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [equipmentList, setEquipmentList] = useState<Equipment[]>([]);
  
  // Form State
  const [newEqName, setNewEqName] = useState('');
  const [newEqStock, setNewEqStock] = useState<number>(0);
  const [newEqPrice, setNewEqPrice] = useState<number>(0);

  useEffect(() => {
    refreshData();
  }, []);

  const refreshData = () => {
    setBookings(storageService.getBookings());
    setEquipmentList(storageService.getEquipment());
  };

  const handleAddEquipment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEqName || newEqStock < 0 || newEqPrice < 0) return;

    storageService.addEquipment({
      name: newEqName,
      totalStock: newEqStock,
      pricePerSession: newEqPrice
    });

    // Reset and refresh
    setNewEqName('');
    setNewEqStock(0);
    setNewEqPrice(0);
    refreshData();
  };

  const totalRevenue = bookings.reduce((sum, b) => sum + b.pricingBreakdown.total, 0);
  const activeBookings = bookings.filter(b => b.status === 'confirmed').length;
  
  // Prepare Chart Data (Revenue per day)
  const chartDataMap = bookings.reduce((acc, curr) => {
    const date = curr.date;
    if (!acc[date]) acc[date] = 0;
    acc[date] += curr.pricingBreakdown.total;
    return acc;
  }, {} as Record<string, number>);

  const chartData = Object.keys(chartDataMap).map(date => ({
    date,
    revenue: chartDataMap[date]
  })).sort((a,b) => a.date.localeCompare(b.date)).slice(-7); // Last 7 days with activity

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-slate-800">Admin Dashboard</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-100 rounded-full text-emerald-600">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">Total Revenue</p>
            <p className="text-2xl font-bold text-slate-800">${totalRevenue.toFixed(2)}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-100 rounded-full text-blue-600">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">Active Bookings</p>
            <p className="text-2xl font-bold text-slate-800">{activeBookings}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-indigo-100 rounded-full text-indigo-600">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">Utilization</p>
            <p className="text-2xl font-bold text-slate-800">-- %</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Chart Section */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h2 className="text-lg font-bold text-slate-800 mb-6">Revenue Trend (Daily)</h2>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="revenue" fill="#4f46e5" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          {chartData.length === 0 && (
            <p className="text-center text-slate-400 text-sm mt-[-150px]">No revenue data available yet.</p>
          )}
        </div>

        {/* Inventory Management Section */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col">
          <div className="flex items-center gap-2 mb-6">
            <div className="p-2 bg-purple-100 rounded-lg text-purple-600">
              <Package className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold text-slate-800">Inventory Management</h2>
          </div>

          <div className="flex-grow overflow-y-auto mb-6 max-h-[300px]">
            <table className="w-full text-sm text-left text-slate-500">
              <thead className="text-xs text-slate-700 uppercase bg-slate-50 sticky top-0">
                <tr>
                  <th className="px-4 py-2">Item</th>
                  <th className="px-4 py-2">Stock</th>
                  <th className="px-4 py-2">Price/Session</th>
                </tr>
              </thead>
              <tbody>
                {equipmentList.map(item => (
                  <tr key={item.id} className="border-b">
                    <td className="px-4 py-3 font-medium text-slate-900">{item.name}</td>
                    <td className="px-4 py-3">{item.totalStock} units</td>
                    <td className="px-4 py-3">${item.pricePerSession}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <form onSubmit={handleAddEquipment} className="pt-6 border-t border-slate-100 bg-slate-50/50 -m-6 p-6 mt-0">
            <h3 className="text-sm font-semibold text-slate-700 mb-3">Add New Equipment</h3>
            <div className="grid grid-cols-3 gap-3 mb-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Name</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Towel"
                  value={newEqName}
                  onChange={e => setNewEqName(e.target.value)}
                  className="w-full text-sm border-slate-300 rounded-lg shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Stock</label>
                <input 
                  type="number" 
                  required
                  min="0"
                  value={newEqStock}
                  onChange={e => setNewEqStock(Number(e.target.value))}
                  className="w-full text-sm border-slate-300 rounded-lg shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Price ($)</label>
                <input 
                  type="number" 
                  required
                  min="0"
                  step="0.01"
                  value={newEqPrice}
                  onChange={e => setNewEqPrice(Number(e.target.value))}
                  className="w-full text-sm border-slate-300 rounded-lg shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2"
                />
              </div>
            </div>
            <button 
              type="submit"
              className="w-full flex justify-center items-center gap-2 px-4 py-2 bg-slate-800 text-white text-sm font-medium rounded-lg hover:bg-slate-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Item
            </button>
          </form>
        </div>
      </div>

      {/* Recent Bookings Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-800">Recent Bookings</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-slate-500">
            <thead className="text-xs text-slate-700 uppercase bg-slate-50">
              <tr>
                <th className="px-6 py-3">ID</th>
                <th className="px-6 py-3">Date</th>
                <th className="px-6 py-3">Time</th>
                <th className="px-6 py-3">Court</th>
                <th className="px-6 py-3">Total</th>
                <th className="px-6 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {bookings.slice().reverse().slice(0, 5).map((booking) => {
                 const courts = storageService.getCourts();
                 const courtName = courts.find(c => c.id === booking.courtId)?.name || 'Unknown';
                 
                 return (
                  <tr key={booking.id} className="bg-white border-b hover:bg-slate-50">
                    <td className="px-6 py-4 font-mono">{booking.id}</td>
                    <td className="px-6 py-4">{booking.date}</td>
                    <td className="px-6 py-4">{booking.startTime}:00 - {booking.endTime}:00</td>
                    <td className="px-6 py-4">{courtName}</td>
                    <td className="px-6 py-4 font-medium text-slate-900">${booking.pricingBreakdown.total.toFixed(2)}</td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        {booking.status}
                      </span>
                    </td>
                  </tr>
                 );
              })}
              {bookings.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-400">
                    No bookings found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminPage;