'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import api from '@/services/api';
import { Prescription, Medicine } from '@/types';
import { Pill, CheckCircle2, Clock, Search, PackageCheck, AlertCircle } from 'lucide-react';

export default function PharmacyDashboard() {
  const { user } = useAuth();
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchPharmacyData();
  }, []);

  const fetchPharmacyData = async () => {
    try {
      const rxRes: any = await api.get('/pharmacy/prescriptions');
      if (rxRes.success) setPrescriptions(rxRes.prescriptions || []);

      const medRes: any = await api.get('/pharmacy/medicines');
      if (medRes.success) setMedicines(medRes.medicines || []);
    } catch (e) {
      console.error('Error fetching pharmacy dashboard', e);
    }
  };

  const handleUpdateStatus = async (prescriptionId: number, newStatus: string) => {
    try {
      const res: any = await api.put(`/prescriptions/${prescriptionId}/status`, { status: newStatus });
      if (res.success) {
        setPrescriptions(prev => prev.map(p => p.id === prescriptionId ? { ...p, status: newStatus as any } : p));
      }
    } catch (e) {
      console.error('Error updating prescription status', e);
    }
  };

  const handleToggleMedicine = async (medId: number, currentAvail: boolean) => {
    try {
      const res: any = await api.put(`/pharmacy/medicines/${medId}/availability`, { is_available: !currentAvail });
      if (res.success) {
        setMedicines(prev => prev.map(m => m.id === medId ? { ...m, is_available: !currentAvail } : m));
      }
    } catch (e) {
      console.error('Error toggling medicine availability', e);
    }
  };

  const filteredMedicines = medicines.filter(m => m.name.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-900 via-orange-950 to-slate-900 text-white p-6 sm:p-8 rounded-3xl shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-3 py-1 bg-amber-500/20 text-amber-300 font-bold text-xs rounded-full border border-amber-500/30">
              PHARMACY FULFILLMENT PORTAL
            </span>
          </div>
          <h1 className="text-3xl font-black mt-2">MedPlus Central Pharmacy</h1>
          <p className="text-xs text-amber-200 mt-1">Ground Floor, City Care Hospital • Contact: +1 555-0401</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Prescription Fulfillment Stream */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="font-bold text-slate-900 text-lg flex items-center space-x-2">
            <Pill className="w-5 h-5 text-amber-600" />
            <span>Digital Prescriptions Stream</span>
          </h3>

          <div className="space-y-4">
            {prescriptions.length === 0 ? (
              <div className="bg-white p-8 rounded-3xl text-center text-slate-500">No prescriptions in queue.</div>
            ) : (
              prescriptions.map(rx => (
                <div key={rx.id} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-md space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div>
                      <span className="text-xs font-bold text-amber-700 block">PRESCRIPTION #{rx.id}</span>
                      <h4 className="font-bold text-slate-900 text-base">{rx.diagnosis}</h4>
                      <p className="text-xs text-slate-500">Patient: {rx.patient_name} • Dr. {rx.doctor_name}</p>
                    </div>

                    {/* Status Dropdown / Action */}
                    <div className="flex items-center space-x-2">
                      <select
                        value={rx.status}
                        onChange={(e) => handleUpdateStatus(rx.id, e.target.value)}
                        className="px-3 py-1.5 bg-slate-50 border border-slate-200 text-slate-800 font-bold text-xs rounded-xl focus:outline-none"
                      >
                        <option value="PRESCRIPTION_RECEIVED">RECEIVED</option>
                        <option value="PREPARING">PREPARING</option>
                        <option value="READY">READY FOR PICKUP</option>
                        <option value="COMPLETED">COMPLETED</option>
                      </select>
                    </div>
                  </div>

                  {/* Medicines Itemized */}
                  <div className="space-y-2">
                    <h5 className="text-xs font-bold uppercase text-slate-400">Prescribed Items</h5>
                    <div className="divide-y divide-slate-100">
                      {rx.items.map((item, idx) => (
                        <div key={idx} className="py-2 flex items-center justify-between text-xs">
                          <div>
                            <span className="font-bold text-slate-900">{item.medicine_name}</span>
                            <span className="text-slate-500 ml-2">({item.dosage})</span>
                          </div>
                          <span className="text-slate-600 font-semibold">{item.duration}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Medicine Inventory Manager */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-md space-y-4">
          <h3 className="font-bold text-slate-900 text-base flex items-center space-x-2">
            <PackageCheck className="w-5 h-5 text-amber-600" />
            <span>Medicine Inventory</span>
          </h3>

          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search inventory..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none"
            />
          </div>

          <div className="divide-y divide-slate-100 max-h-[450px] overflow-y-auto">
            {filteredMedicines.map(med => (
              <div key={med.id} className="py-3 flex items-center justify-between text-xs">
                <div>
                  <h4 className="font-bold text-slate-900">{med.name}</h4>
                  <span className="text-slate-500 block">${med.unit_price.toFixed(2)} • Stock: {med.stock_quantity}</span>
                </div>
                <button
                  onClick={() => handleToggleMedicine(med.id, med.is_available)}
                  className={`px-3 py-1 font-bold text-[10px] rounded-full transition-all ${
                    med.is_available ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                  }`}
                >
                  {med.is_available ? 'AVAILABLE' : 'OUT OF STOCK'}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
