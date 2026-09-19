'use client';

import React, { useEffect, useState } from 'react';
import { QueueItem } from '@/types';
import { Clock, Users, AlertTriangle, CheckCircle2, ShieldAlert, Sparkles } from 'lucide-react';
import { io } from 'socket.io-client';

interface QueueTrackerProps {
  tokenItem: QueueItem | null;
  onRefresh?: () => void;
}

export const QueueTrackerWidget: React.FC<QueueTrackerProps> = ({ tokenItem, onRefresh }) => {
  const [liveToken, setLiveToken] = useState<QueueItem | null>(tokenItem);
  const [emergencyAlert, setEmergencyAlert] = useState<string | null>(null);

  useEffect(() => {
    setLiveToken(tokenItem);
  }, [tokenItem]);

  useEffect(() => {
    if (!tokenItem?.queue_id) return;

    // Connect socket for real-time updates
    const socket = io('http://localhost:5000', {
      transports: ['websocket', 'polling']
    });

    socket.on(`queue_update_${tokenItem.queue_id}`, (payload: any) => {
      if (payload?.items) {
        const updated = payload.items.find((i: any) => i.id === tokenItem.id);
        if (updated) {
          setLiveToken(updated);
        }
      }
      if (onRefresh) onRefresh();
    });

    socket.on('global_queue_update', () => {
      if (onRefresh) onRefresh();
    });

    return () => {
      socket.disconnect();
    };
  }, [tokenItem?.queue_id, onRefresh]);

  if (!liveToken) {
    return (
      <div className="bg-slate-50 border border-dashed border-slate-200 rounded-3xl p-8 text-center text-slate-500">
        <Clock className="w-10 h-10 mx-auto text-slate-300 mb-2" />
        <h4 className="font-semibold text-slate-700">No Active Token</h4>
        <p className="text-xs text-slate-400 mt-1">Book a consultation token to track your live queue position.</p>
      </div>
    );
  }

  const isCompleted = liveToken.status === 'COMPLETED';
  const isCancelled = liveToken.status === 'CANCELLED';
  const isCalling = liveToken.status === 'IN_PROGRESS';
  const isEmergency = liveToken.is_emergency;

  const patientsBefore = Math.max(0, liveToken.position - 1);

  return (
    <div className="bg-gradient-to-br from-white via-cyan-50/30 to-teal-50/20 border border-cyan-100/80 rounded-3xl p-6 shadow-xl shadow-cyan-950/5 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-cyan-400/10 to-emerald-400/0 rounded-full blur-2xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-100">
        <div className="flex items-center space-x-2">
          <span className="w-3 h-3 rounded-full bg-emerald-500 animate-ping" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Real-Time Queue Monitor
          </span>
        </div>
        <span className={`px-3 py-1 text-xs font-bold rounded-full ${
          isCalling ? 'bg-amber-100 text-amber-700 border border-amber-300 animate-pulse' :
          isCompleted ? 'bg-emerald-100 text-emerald-700' :
          isCancelled ? 'bg-rose-100 text-rose-700' :
          'bg-cyan-100 text-cyan-800'
        }`}>
          {isCalling ? 'IN CONSULTATION' : liveToken.status}
        </span>
      </div>

      {/* Emergency Alert Banner */}
      {isEmergency && (
        <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-2xl flex items-center space-x-3 text-amber-800 text-xs font-medium">
          <ShieldAlert className="w-5 h-5 text-amber-600 flex-shrink-0 animate-bounce" />
          <span>Priority Emergency Consultation Assigned. Priority token code: {liveToken.token_code}</span>
        </div>
      )}

      {/* Main Token Display Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
        {/* Token Number */}
        <div className="bg-white/80 p-4 rounded-2xl border border-slate-100 shadow-sm text-center">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
            Your Token
          </span>
          <span className="text-3xl font-black bg-gradient-to-r from-cyan-600 to-teal-600 bg-clip-text text-transparent">
            {liveToken.token_code}
          </span>
        </div>

        {/* Patients Ahead */}
        <div className="bg-white/80 p-4 rounded-2xl border border-slate-100 shadow-sm text-center">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
            Patients Before You
          </span>
          <div className="flex items-center justify-center space-x-1">
            <Users className="w-5 h-5 text-slate-400" />
            <span className="text-2xl font-bold text-slate-800">{patientsBefore}</span>
          </div>
        </div>

        {/* Estimated Wait */}
        <div className="bg-white/80 p-4 rounded-2xl border border-slate-100 shadow-sm text-center">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
            Est. Wait Time
          </span>
          <div className="flex items-center justify-center space-x-1">
            <Clock className="w-5 h-5 text-cyan-600" />
            <span className="text-2xl font-bold text-slate-800">
              {liveToken.estimated_wait_mins} <span className="text-xs font-normal text-slate-500">mins</span>
            </span>
          </div>
        </div>

        {/* Queue Position */}
        <div className="bg-white/80 p-4 rounded-2xl border border-slate-100 shadow-sm text-center">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
            Queue Position
          </span>
          <span className="text-2xl font-bold text-teal-600">
            #{liveToken.position}
          </span>
        </div>
      </div>

      {/* Progress Bar Visualizer */}
      <div className="mt-6 pt-4 border-t border-slate-100">
        <div className="flex justify-between text-xs text-slate-500 font-semibold mb-2">
          <span>Consultation Start</span>
          <span>Your Turn (#{liveToken.position})</span>
        </div>
        <div className="w-full bg-slate-200/80 rounded-full h-3 overflow-hidden p-0.5">
          <div
            className="bg-gradient-to-r from-cyan-500 via-teal-500 to-emerald-500 h-full rounded-full transition-all duration-500 shadow-sm"
            style={{ width: `${Math.max(15, Math.min(100, 100 - (patientsBefore * 20)))}%` }}
          />
        </div>
      </div>
    </div>
  );
};
