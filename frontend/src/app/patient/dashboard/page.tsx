'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { QueueTrackerWidget } from '@/components/QueueTrackerWidget';
import { HospitalMap } from '@/components/HospitalMap';
import { AIHealthAssistant } from '@/components/AIHealthAssistant';
import api from '@/services/api';
import { Hospital, Doctor, QueueItem, Prescription, MedicalRecord } from '@/types';
import { User, Heart, ShieldAlert, FileText, Calendar, MapPin, Stethoscope, Clock, CheckCircle2 } from 'lucide-react';

export default function PatientDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'queue' | 'ai' | 'hospitals' | 'prescriptions' | 'records'>('queue');

  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [selectedHospital, setSelectedHospital] = useState<Hospital | null>(null);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [activeToken, setActiveToken] = useState<QueueItem | null>(null);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [records, setRecords] = useState<MedicalRecord[]>([]);

  const [filterDepartment, setFilterDepartment] = useState<string>('');
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingMessage, setBookingMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchHospitals();
    fetchPatientData();
  }, []);

  const fetchHospitals = async (dept?: string) => {
    try {
      const url = dept ? `/hospitals?department=${encodeURIComponent(dept)}` : '/hospitals';
      const res: any = await api.get(url);
      if (res.success) {
        setHospitals(res.hospitals || []);
        if (res.hospitals.length > 0 && !selectedHospital) {
          setSelectedHospital(res.hospitals[0]);
        }
      }
    } catch (e) {
      console.error('Failed to load hospitals', e);
    }
  };

  const fetchPatientData = async () => {
    try {
      // 1. Fetch patient token status if available
      const meRes: any = await api.get('/auth/me');
      if (meRes.success && meRes.user?.patient) {
        const patientId = meRes.user.patient.id;

        // Fetch prescriptions & records
        const rxRes: any = await api.get(`/prescriptions/patient/${patientId}`);
        if (rxRes.success) setPrescriptions(rxRes.prescriptions || []);

        const recRes: any = await api.get(`/patients/${patientId}/records`);
        if (recRes.success) setRecords(recRes.records || []);

        // Demo fallback token lookup if seeded token G-27
        const tokenRes: any = await api.get('/tokens/5'); // Token id 5 is G-27 for Sarah Jenkins
        if (tokenRes.success) {
          setActiveToken(tokenRes.token);
        }
      }
    } catch (e) {
      console.error('Error fetching patient data', e);
    }
  };

  const handleBookToken = async (doc: Doctor) => {
    if (!selectedHospital) return;
    setBookingLoading(true);
    setBookingMessage(null);

    try {
      const res: any = await api.post('/tokens/book', {
        hospital_id: selectedHospital.id,
        doctor_id: doc.id,
        department_id: doc.department_id
      });

      if (res.success && res.token) {
        setActiveToken(res.token);
        setBookingMessage(`Successfully booked token ${res.token.token_code}! Position: ${res.token.position}`);
        setActiveTab('queue');
      }
    } catch (err: any) {
      setBookingMessage(err.message || 'Token booking failed.');
    } finally {
      setBookingLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Patient Welcome Header */}
      <div className="bg-gradient-to-r from-white via-cyan-50/50 to-teal-50/40 p-6 rounded-3xl border border-slate-200/80 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-full">
              PATIENT PORTAL
            </span>
            <span className="text-xs text-slate-400">ID: #{user?.patient_id || 'P-101'}</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 mt-1">Hello, {user?.name || 'Sarah Jenkins'}</h1>
          <p className="text-xs text-slate-500">Welcome to your smart healthcare dashboard. Track your queue live below.</p>
        </div>

        <div className="flex items-center space-x-6 bg-white/80 p-3.5 rounded-2xl border border-slate-100 text-xs">
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Age / Gender</span>
            <span className="font-bold text-slate-800">32 / Female</span>
          </div>
          <div className="border-l border-slate-200 pl-4">
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Blood Group</span>
            <span className="font-bold text-rose-600">A+</span>
          </div>
          <div className="border-l border-slate-200 pl-4">
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Emergency Contact</span>
            <span className="font-bold text-slate-800">+1 555-9999</span>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center space-x-2 border-b border-slate-200 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveTab('queue')}
          className={`px-5 py-3 font-bold text-sm rounded-t-2xl transition-all ${
            activeTab === 'queue' ? 'bg-cyan-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Live Token Queue
        </button>
        <button
          onClick={() => setActiveTab('ai')}
          className={`px-5 py-3 font-bold text-sm rounded-t-2xl transition-all ${
            activeTab === 'ai' ? 'bg-cyan-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          AI Health Assistant
        </button>
        <button
          onClick={() => setActiveTab('hospitals')}
          className={`px-5 py-3 font-bold text-sm rounded-t-2xl transition-all ${
            activeTab === 'hospitals' ? 'bg-cyan-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Find Hospitals & Book Token
        </button>
        <button
          onClick={() => setActiveTab('prescriptions')}
          className={`px-5 py-3 font-bold text-sm rounded-t-2xl transition-all ${
            activeTab === 'prescriptions' ? 'bg-cyan-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Digital Prescriptions ({prescriptions.length})
        </button>
        <button
          onClick={() => setActiveTab('records')}
          className={`px-5 py-3 font-bold text-sm rounded-t-2xl transition-all ${
            activeTab === 'records' ? 'bg-cyan-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Medical Records ({records.length})
        </button>
      </div>

      {/* TAB CONTENT */}

      {/* 1. QUEUE TRACKER TAB */}
      {activeTab === 'queue' && (
        <div className="space-y-6">
          <QueueTrackerWidget tokenItem={activeToken} onRefresh={fetchPatientData} />

          {/* Quick Info Card */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-start space-x-3">
              <div className="p-3 bg-cyan-100 text-cyan-700 rounded-2xl">
                <Stethoscope className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-slate-800 text-sm">Assigned Specialist</h4>
                <p className="text-xs text-slate-500">Dr. Rahul Sharma (General Medicine)</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="p-3 bg-emerald-100 text-emerald-700 rounded-2xl">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-slate-800 text-sm">Medical Center</h4>
                <p className="text-xs text-slate-500">City Care Multi-Specialty Hospital</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="p-3 bg-purple-100 text-purple-700 rounded-2xl">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-slate-800 text-sm">Consultation Duration</h4>
                <p className="text-xs text-slate-500">Avg. 12 minutes per consultation</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. AI HEALTH ASSISTANT TAB */}
      {activeTab === 'ai' && (
        <div className="space-y-6">
          <AIHealthAssistant
            onCategorySelected={(cat) => {
              setFilterDepartment(cat);
              fetchHospitals(cat);
            }}
          />
        </div>
      )}

      {/* 3. FIND HOSPITALS & BOOK TOKEN TAB */}
      {activeTab === 'hospitals' && (
        <div className="space-y-6">
          {bookingMessage && (
            <div className="p-4 bg-cyan-50 border border-cyan-200 text-cyan-800 text-xs rounded-2xl flex items-center justify-between">
              <span>{bookingMessage}</span>
              <button onClick={() => setBookingMessage(null)} className="font-bold">Dismiss</button>
            </div>
          )}

          {/* Interactive Map */}
          <HospitalMap
            hospitals={hospitals}
            onSelectHospital={(h) => setSelectedHospital(h)}
            selectedHospitalId={selectedHospital?.id}
          />

          {/* Doctors Available for Token Booking */}
          {selectedHospital && (
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-md">
              <h3 className="font-bold text-slate-900 text-lg mb-4">
                Available Doctors at {selectedHospital.name}
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {selectedHospital.doctors?.map(doc => (
                  <div key={doc.id} className="p-5 border border-slate-200 rounded-2xl bg-slate-50/50 hover:bg-white transition-all space-y-3">
                    <div>
                      <span className="px-2.5 py-0.5 bg-cyan-100 text-cyan-800 text-[10px] font-bold rounded-full">
                        {doc.specialization || 'Specialist'}
                      </span>
                      <h4 className="font-bold text-slate-900 text-base mt-1">{doc.name}</h4>
                      <p className="text-xs text-slate-500">{doc.qualification}</p>
                    </div>

                    <div className="text-xs text-slate-600 space-y-1 pt-2 border-t border-slate-100">
                      <div>Experience: <span className="font-semibold text-slate-800">{doc.experience_years} years</span></div>
                      <div>Avg Consultation: <span className="font-semibold text-slate-800">{doc.avg_consultation_time_mins} mins</span></div>
                    </div>

                    <button
                      onClick={() => handleBookToken(doc)}
                      disabled={bookingLoading}
                      className="w-full py-2.5 bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-700 hover:to-teal-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all"
                    >
                      Book Consultation Token
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 4. DIGITAL PRESCRIPTIONS TAB */}
      {activeTab === 'prescriptions' && (
        <div className="space-y-4">
          <h3 className="font-bold text-slate-900 text-lg">Your Digital Prescriptions</h3>
          {prescriptions.length === 0 ? (
            <div className="bg-white p-8 rounded-3xl text-center text-slate-500">No prescriptions found.</div>
          ) : (
            prescriptions.map(rx => (
              <div key={rx.id} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-md space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div>
                    <span className="text-xs font-bold text-cyan-700 block">PRESCRIPTION #{rx.id}</span>
                    <h4 className="font-bold text-slate-900 text-base">{rx.diagnosis}</h4>
                    <p className="text-xs text-slate-500">Issued by {rx.doctor_name} • {rx.hospital_name}</p>
                  </div>
                  <span className="px-3 py-1 bg-amber-100 text-amber-800 font-bold text-xs rounded-full">
                    {rx.status.replace('_', ' ')}
                  </span>
                </div>

                <div className="space-y-2">
                  <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400">Prescribed Medicines</h5>
                  <div className="divide-y divide-slate-100">
                    {rx.items.map((item, idx) => (
                      <div key={idx} className="py-2 flex items-center justify-between text-xs">
                        <div>
                          <span className="font-bold text-slate-800">{item.medicine_name}</span>
                          <span className="text-slate-500 ml-2">({item.dosage})</span>
                        </div>
                        <div className="text-slate-600">
                          <span>{item.frequency}</span> • <span>{item.duration}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* 5. MEDICAL RECORDS TAB */}
      {activeTab === 'records' && (
        <div className="space-y-4">
          <h3 className="font-bold text-slate-900 text-lg">Medical Records & Consultation History</h3>
          {records.length === 0 ? (
            <div className="bg-white p-8 rounded-3xl text-center text-slate-500">No records found.</div>
          ) : (
            records.map(rec => (
              <div key={rec.id} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-900 text-sm">{rec.title}</h4>
                  <span className="text-xs text-slate-400">{new Date(rec.record_date).toLocaleDateString()}</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">{rec.notes}</p>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
