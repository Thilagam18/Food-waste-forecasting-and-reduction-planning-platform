'use client';

import React, { useEffect, useState } from 'react';
import { Hospital } from '@/types';
import { MapPin, Navigation, Clock, Phone, Stethoscope, Compass } from 'lucide-react';

interface HospitalMapProps {
  hospitals: Hospital[];
  onSelectHospital?: (hospital: Hospital) => void;
  selectedHospitalId?: number | null;
}

export const HospitalMap: React.FC<HospitalMapProps> = ({
  hospitals,
  onSelectHospital,
  selectedHospitalId
}) => {
  const [isClient, setIsClient] = useState(false);
  const [selectedHosp, setSelectedHosp] = useState<Hospital | null>(null);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (selectedHospitalId) {
      const match = hospitals.find(h => h.id === selectedHospitalId);
      if (match) setSelectedHosp(match);
    } else if (hospitals.length > 0 && !selectedHosp) {
      setSelectedHosp(hospitals[0]);
    }
  }, [hospitals, selectedHospitalId]);

  if (!isClient) {
    return (
      <div className="w-full h-80 bg-slate-100 animate-pulse rounded-3xl flex items-center justify-center text-slate-400">
        Loading Hospital Navigation Map...
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-3xl shadow-xl overflow-hidden flex flex-col md:flex-row h-[500px]">
      {/* Sidebar Hospital List */}
      <div className="w-full md:w-80 border-r border-slate-200 overflow-y-auto divide-y divide-slate-100 bg-slate-50/50">
        <div className="p-4 bg-white sticky top-0 z-10 border-b border-slate-100">
          <h3 className="font-bold text-slate-800 text-sm flex items-center space-x-2">
            <Compass className="w-4 h-4 text-cyan-600" />
            <span>Nearby Medical Centers ({hospitals.length})</span>
          </h3>
        </div>

        {hospitals.map(h => (
          <div
            key={h.id}
            onClick={() => {
              setSelectedHosp(h);
              if (onSelectHospital) onSelectHospital(h);
            }}
            className={`p-4 transition-all cursor-pointer hover:bg-white ${
              selectedHosp?.id === h.id ? 'bg-white border-l-4 border-cyan-600 shadow-sm' : ''
            }`}
          >
            <div className="flex items-start justify-between">
              <h4 className="font-bold text-sm text-slate-900 line-clamp-1">{h.name}</h4>
              <span className="px-2 py-0.5 bg-cyan-100 text-cyan-800 font-semibold text-[10px] rounded-full flex-shrink-0">
                {h.distance_km || 3.5} km
              </span>
            </div>

            <p className="text-xs text-slate-500 mt-1 line-clamp-1">{h.address}</p>

            <div className="flex items-center space-x-4 mt-3 text-[11px] text-slate-600">
              <span className="flex items-center space-x-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>Wait ~{h.estimated_wait_mins || 15}m</span>
              </span>
              <span className="flex items-center space-x-1">
                <Stethoscope className="w-3.5 h-3.5 text-slate-400" />
                <span>{h.doctors_count || 3} Docs</span>
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Map Interactive Canvas */}
      <div className="flex-1 bg-slate-100 relative p-6 flex flex-col justify-between" style={{ backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)', backgroundSize: '16px 16px' }}>
        {/* Top Info Banner */}
        <div className="bg-white/90 backdrop-blur-md p-4 rounded-2xl border border-slate-200 shadow-md flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-700">Selected Healthcare Center</span>
            <h4 className="font-bold text-slate-900">{selectedHosp?.name || 'Select Hospital'}</h4>
          </div>
          {selectedHosp && (
            <button
              onClick={() => onSelectHospital && onSelectHospital(selectedHosp)}
              className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-700 hover:to-teal-700 text-white font-medium text-xs rounded-xl shadow-md transition-all flex items-center space-x-1"
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>Book Token Here</span>
            </button>
          )}
        </div>

        {/* Visual Map Pin Presentation */}
        <div className="my-auto text-center py-10">
          <div className="relative inline-block">
            <div className="w-20 h-20 bg-cyan-500/20 rounded-full animate-ping absolute inset-0 m-auto" />
            <div className="w-16 h-16 bg-gradient-to-tr from-cyan-600 to-emerald-500 rounded-full flex items-center justify-center text-white shadow-xl shadow-cyan-600/30 relative z-10 mx-auto">
              <MapPin className="w-8 h-8" />
            </div>
          </div>
          <h4 className="font-bold text-slate-800 text-lg mt-4">{selectedHosp?.name}</h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">{selectedHosp?.address}</p>

          <div className="flex justify-center space-x-2 mt-4">
            {selectedHosp?.departments.map(d => (
              <span key={d.id} className="px-2.5 py-1 bg-white border border-slate-200 text-slate-700 text-[11px] font-medium rounded-lg shadow-sm">
                {d.name}
              </span>
            ))}
          </div>
        </div>

        {/* Footer Navigation bar */}
        <div className="bg-white/90 backdrop-blur-md p-3 rounded-xl border border-slate-200 text-xs text-slate-600 flex items-center justify-between">
          <span>Map Provider: OpenStreetMap / Leaflet Engine</span>
          <span className="font-semibold text-cyan-700">Coordinates: {selectedHosp?.latitude.toFixed(4)}, {selectedHosp?.longitude.toFixed(4)}</span>
        </div>
      </div>
    </div>
  );
};
