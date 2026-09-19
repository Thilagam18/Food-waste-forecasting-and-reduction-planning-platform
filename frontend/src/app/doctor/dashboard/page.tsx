'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import api from '@/services/api';
import { Doctor, Queue, QueueItem } from '@/types';
import { User, Stethoscope, Users, Clock, ShieldAlert, Plus, CheckCircle2, FileText, Activity } from 'lucide-react';

export default function DoctorDashboard() {
  const { user } = useAuth();
  const [doctorData, setDoctorData] = useState<Doctor | null>(null);
  const [queue, setQueue] = useState<Queue | null>(null);
  const [waitingQueue, setWaitingQueue] = useState<QueueItem[]>([]);
  const [currentPatient, setCurrentPatient] = useState<QueueItem | null>(null);
  const [completedCount, setCompletedCount] = useState<number>(0);

  const [emergencyModal, setEmergencyModal] = useState(false);
  const [emergencyReason, setEmergencyReason] = useState('');
  const [prescriptionModal, setPrescriptionModal] = useState(false);

  const [diagnosis, setDiagnosis] = useState('');
  const [notes, setNotes] = useState('');
  const [medicines, setMedicines] = useState([
    { name: 'Paracetamol 650mg', dosage: '1 Tab', frequency: 'TID', duration: '3 days', instructions: 'After food' }
  ]);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const res: any = await api.get('/doctors/dashboard');
      if (res.success) {
        setDoctorData(res.doctor);
        setQueue(res.queue);
        setWaitingQueue(res.waiting_queue || []);
        setCurrentPatient(res.current_patient);
        setCompletedCount(res.completed_today_count || 0);
      }
    } catch (e) {
      console.error('Error fetching doctor dashboard', e);
    }
  };

  const handleCallNext = async () => {
    if (!queue) return;
    try {
      const res: any = await api.post(`/queue/${queue.id}/next`, {});
      if (res.success) {
        fetchDashboard();
      }
    } catch (e) {
      console.error('Error calling next token', e);
    }
  };

  const handleEmergencyTrigger = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!queue || !currentPatient && waitingQueue.length === 0) return;
    const targetPatientId = currentPatient?.patient_id || waitingQueue[0]?.patient_id;

    try {
      const res: any = await api.post(`/queue/${queue.id}/emergency`, {
        patient_id: targetPatientId,
        reason: emergencyReason || 'Critical emergency consultation interjected.'
      });
      if (res.success) {
        setEmergencyModal(false);
        setEmergencyReason('');
        fetchDashboard();
      }
    } catch (e) {
      console.error('Error triggering emergency case', e);
    }
  };

  const handleIssuePrescription = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPatient) return;

    try {
      const res: any = await api.post('/prescriptions', {
        patient_id: currentPatient.patient_id,
        diagnosis,
        clinical_notes: notes,
        medicines
      });
      if (res.success) {
        setPrescriptionModal(false);
        alert('Digital prescription issued successfully!');
        handleCallNext(); // complete and move to next
      }
    } catch (e) {
      console.error('Error issuing prescription', e);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Doctor Header */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white p-6 sm:p-8 rounded-3xl shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-3 py-1 bg-blue-500/20 text-blue-300 font-bold text-xs rounded-full border border-blue-500/30">
              DOCTOR CLINICAL DASHBOARD
            </span>
            <span className="text-xs text-slate-400">Department: General Medicine</span>
          </div>
          <h1 className="text-3xl font-black mt-2">Dr. Rahul Sharma</h1>
          <p className="text-xs text-slate-300 mt-1">MD (Internal Medicine) • City Care Multi-Specialty Hospital</p>
        </div>

        {/* Quick Action Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleCallNext}
            className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold text-sm rounded-2xl shadow-lg transition-all flex items-center space-x-2"
          >
            <Activity className="w-4 h-4" />
            <span>Call Next Token</span>
          </button>

          <button
            onClick={() => setEmergencyModal(true)}
            className="px-5 py-3 bg-rose-600/30 hover:bg-rose-600/50 border border-rose-500/40 text-rose-200 font-bold text-sm rounded-2xl transition-all flex items-center space-x-2"
          >
            <ShieldAlert className="w-4 h-4 text-rose-400" />
            <span>Inject Emergency Case</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm text-center">
          <span className="text-xs font-semibold text-slate-400 block mb-1">Current Token</span>
          <span className="text-3xl font-black text-cyan-600">{queue?.current_token || 'None'}</span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm text-center">
          <span className="text-xs font-semibold text-slate-400 block mb-1">Patients Waiting</span>
          <span className="text-3xl font-black text-amber-600">{waitingQueue.length}</span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm text-center">
          <span className="text-xs font-semibold text-slate-400 block mb-1">Completed Today</span>
          <span className="text-3xl font-black text-emerald-600">{completedCount}</span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm text-center">
          <span className="text-xs font-semibold text-slate-400 block mb-1">Avg Consultation</span>
          <span className="text-3xl font-black text-slate-800">12 <span className="text-xs text-slate-400 font-normal">mins</span></span>
        </div>
      </div>

      {/* Main Grid: Active Patient & Waiting Queue */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Active Consultation Panel */}
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-200 shadow-md space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <h3 className="font-bold text-slate-900 text-lg flex items-center space-x-2">
              <Stethoscope className="w-5 h-5 text-cyan-600" />
              <span>Active Consultation</span>
            </h3>
            {currentPatient && (
              <span className="px-3 py-1 bg-amber-100 text-amber-800 text-xs font-bold rounded-full animate-pulse">
                IN PROGRESS
              </span>
            )}
          </div>

          {currentPatient ? (
            <div className="space-y-6">
              <div className="bg-cyan-50/60 p-6 rounded-2xl border border-cyan-100 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-cyan-700 uppercase tracking-wider block">Token Code</span>
                  <span className="text-4xl font-black text-cyan-900">{currentPatient.token_code}</span>
                  <p className="text-sm font-bold text-slate-800 mt-2">Patient: {currentPatient.patient_name}</p>
                </div>
                <button
                  onClick={() => setPrescriptionModal(true)}
                  className="px-6 py-3 bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-700 text-white font-bold text-sm rounded-xl shadow-md transition-all flex items-center space-x-2"
                >
                  <FileText className="w-4 h-4" />
                  <span>Issue Digital Prescription</span>
                </button>
              </div>

              {/* Consultation Notes Quick Input */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                  Clinical Examination & Diagnosis Notes
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Record symptoms, blood pressure, vitals, and diagnostic findings..."
                  rows={4}
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:border-cyan-600"
                />
              </div>
            </div>
          ) : (
            <div className="p-12 text-center text-slate-400">
              No patient currently in consultation room. Click "Call Next Token" to begin.
            </div>
          )}
        </div>

        {/* Waiting Queue List */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-md space-y-4">
          <h3 className="font-bold text-slate-900 text-base flex items-center justify-between">
            <span>Waiting Patients</span>
            <span className="px-2.5 py-0.5 bg-slate-100 text-slate-700 text-xs font-bold rounded-full">
              {waitingQueue.length}
            </span>
          </h3>

          <div className="divide-y divide-slate-100 max-h-[400px] overflow-y-auto">
            {waitingQueue.map((item, idx) => (
              <div key={item.id} className="py-3 flex items-center justify-between text-xs">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-slate-900 text-sm">{item.token_code}</span>
                    {item.is_emergency && (
                      <span className="px-2 py-0.5 bg-rose-100 text-rose-700 font-bold text-[10px] rounded-full">
                        EMERGENCY
                      </span>
                    )}
                  </div>
                  <span className="text-slate-500 block">{item.patient_name}</span>
                </div>
                <div className="text-right">
                  <span className="text-slate-400 block">Pos #{item.position}</span>
                  <span className="font-semibold text-cyan-700">{item.estimated_wait_mins}m wait</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* EMERGENCY INJECTION MODAL */}
      {emergencyModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white max-w-md w-full p-6 rounded-3xl border border-slate-200 shadow-2xl space-y-4">
            <h3 className="font-bold text-slate-900 text-lg flex items-center space-x-2 text-rose-600">
              <ShieldAlert className="w-6 h-6" />
              <span>Trigger Emergency Interruption</span>
            </h3>
            <p className="text-xs text-slate-500">
              Emergency tokens receive immediate priority #1 after active patient. All downstream patient ETAs will automatically recalculate.
            </p>

            <form onSubmit={handleEmergencyTrigger} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Emergency Severity Details</label>
                <textarea
                  required
                  value={emergencyReason}
                  onChange={(e) => setEmergencyReason(e.target.value)}
                  placeholder="e.g. Severe respiratory distress / Cardiac instability requiring urgent care..."
                  rows={3}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEmergencyModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-md"
                >
                  Inject Priority Case
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PRESCRIPTION BUILDER MODAL */}
      {prescriptionModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white max-w-lg w-full p-6 rounded-3xl border border-slate-200 shadow-2xl space-y-4">
            <h3 className="font-bold text-slate-900 text-lg">Digital Prescription Builder</h3>

            <form onSubmit={handleIssuePrescription} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Primary Diagnosis</label>
                <input
                  type="text"
                  required
                  value={diagnosis}
                  onChange={(e) => setDiagnosis(e.target.value)}
                  placeholder="e.g. Acute Upper Respiratory Infection"
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Prescribed Medicines</label>
                {medicines.map((m, idx) => (
                  <div key={idx} className="p-3 border border-slate-100 rounded-xl bg-slate-50/50 space-y-2 mb-2">
                    <input
                      type="text"
                      value={m.name}
                      onChange={(e) => {
                        const copy = [...medicines];
                        copy[idx].name = e.target.value;
                        setMedicines(copy);
                      }}
                      placeholder="Medicine Name (e.g. Amoxicillin 500mg)"
                      className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs"
                    />
                    <div className="grid grid-cols-3 gap-2">
                      <input
                        type="text"
                        value={m.dosage}
                        onChange={(e) => {
                          const copy = [...medicines];
                          copy[idx].dosage = e.target.value;
                          setMedicines(copy);
                        }}
                        placeholder="Dosage"
                        className="p-2 bg-white border border-slate-200 rounded-lg text-xs"
                      />
                      <input
                        type="text"
                        value={m.frequency}
                        onChange={(e) => {
                          const copy = [...medicines];
                          copy[idx].frequency = e.target.value;
                          setMedicines(copy);
                        }}
                        placeholder="Frequency"
                        className="p-2 bg-white border border-slate-200 rounded-lg text-xs"
                      />
                      <input
                        type="text"
                        value={m.duration}
                        onChange={(e) => {
                          const copy = [...medicines];
                          copy[idx].duration = e.target.value;
                          setMedicines(copy);
                        }}
                        placeholder="Duration"
                        className="p-2 bg-white border border-slate-200 rounded-lg text-xs"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setPrescriptionModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs rounded-xl shadow-md"
                >
                  Issue Digital Prescription
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
