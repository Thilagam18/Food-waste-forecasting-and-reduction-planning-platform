'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import api from '@/services/api';
import { Hospital, Doctor, Queue } from '@/types';
import { Building2, Users, Stethoscope, Clock, Activity, ShieldAlert, Plus, CheckCircle2 } from 'lucide-react';

export default function HospitalDashboard() {
  const { user } = useAuth();
  const [hospital, setHospital] = useState<Hospital | null>(null);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [queues, setQueues] = useState<Queue[]>([]);

  useEffect(() => {
    fetchHospitalData();
  }, []);

  const fetchHospitalData = async () => {
    try {
      const res: any = await api.get('/hospitals/1'); // City Care Multi-Specialty Hospital
      if (res.success) {
        setHospital(res.hospital);
        setDoctors(res.hospital.doctors || []);
        setQueues(res.hospital.active_queues || []);
      }
    } catch (e) {
      console.error('Error loading hospital admin dashboard', e);
    }
  };

  const totalWaiting = queues.reduce((acc, q) => acc + (q.waiting_patients_count || 0), 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Hospital Admin Header */}
      <div className="bg-gradient-to-r from-purple-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-8 rounded-3xl shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-3 py-1 bg-purple-500/20 text-purple-300 font-bold text-xs rounded-full border border-purple-500/30">
              HOSPITAL ADMINISTRATION
            </span>
            <span className="text-xs text-slate-400">Operating Hours: 24/7 Emergency</span>
          </div>
          <h1 className="text-3xl font-black mt-2">{hospital?.name || 'City Care Multi-Specialty Hospital'}</h1>
          <p className="text-xs text-slate-300 mt-1">{hospital?.address || '124 Central Health Boulevard, City Center'}</p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={fetchHospitalData}
            className="px-5 py-2.5 bg-purple-600/40 hover:bg-purple-600/60 border border-purple-400/30 text-white font-bold text-xs rounded-xl transition-all"
          >
            Refresh Live Queues
          </button>
        </div>
      </div>

      {/* Monitoring Analytics Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm text-center">
          <span className="text-xs font-semibold text-slate-400 block mb-1">Total Patients Today</span>
          <span className="text-3xl font-black text-slate-900">27</span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm text-center">
          <span className="text-xs font-semibold text-slate-400 block mb-1">Waiting Patients</span>
          <span className="text-3xl font-black text-amber-600">{totalWaiting || 4}</span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm text-center">
          <span className="text-xs font-semibold text-slate-400 block mb-1">Active Consultations</span>
          <span className="text-3xl font-black text-cyan-600">1</span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm text-center">
          <span className="text-xs font-semibold text-slate-400 block mb-1">Avg Hospital Wait</span>
          <span className="text-3xl font-black text-emerald-600">18 <span className="text-xs text-slate-400 font-normal">mins</span></span>
        </div>
      </div>

      {/* Live Department Queues Monitor */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-md space-y-6">
        <h3 className="font-bold text-slate-900 text-lg flex items-center space-x-2">
          <Activity className="w-5 h-5 text-purple-600" />
          <span>Department Queue Status</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {queues.length === 0 ? (
            <div className="p-8 text-center text-slate-400 col-span-2">No active queues found.</div>
          ) : (
            queues.map(q => (
              <div key={q.id} className="p-5 border border-slate-200 rounded-2xl bg-slate-50/50 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-900 text-sm">{q.doctor_name || 'Dr. Rahul Sharma'}</h4>
                  <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full">
                    {q.status}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center text-xs pt-2 border-t border-slate-200/60">
                  <div>
                    <span className="text-slate-400 block">Current Serving</span>
                    <span className="font-bold text-cyan-700">{q.current_token}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Total Tokens</span>
                    <span className="font-bold text-slate-800">{q.total_tokens_today}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Waiting Count</span>
                    <span className="font-bold text-amber-600">{q.waiting_patients_count}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Doctor Availability Configuration */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-md space-y-4">
        <h3 className="font-bold text-slate-900 text-lg flex items-center space-x-2">
          <Stethoscope className="w-5 h-5 text-indigo-600" />
          <span>Staff Doctors & Availability</span>
        </h3>

        <div className="divide-y divide-slate-100">
          {doctors.map(doc => (
            <div key={doc.id} className="py-3 flex items-center justify-between text-xs">
              <div>
                <h4 className="font-bold text-slate-900 text-sm">{doc.name}</h4>
                <span className="text-slate-500">{doc.specialization} • {doc.qualification}</span>
              </div>
              <div className="flex items-center space-x-3">
                <span className={`px-2.5 py-1 font-bold rounded-full ${
                  doc.is_available ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                }`}>
                  {doc.is_available ? 'AVAILABLE' : 'OFF DUTY'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
