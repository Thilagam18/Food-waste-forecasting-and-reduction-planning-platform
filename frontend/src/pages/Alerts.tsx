import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Clock,
  Check,
  ShieldAlert,
  Info
} from 'lucide-react';
import { alertService } from '../services/api';

export const Alerts: React.FC = () => {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filterResolved, setFilterResolved] = useState<string>('false');

  useEffect(() => {
    fetchAlerts();
  }, [filterResolved]);

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const res = await alertService.list({
        is_resolved: filterResolved === 'all' ? undefined : filterResolved === 'true'
      });
      if (res.data?.success) setAlerts(res.data.data);
    } catch (err) {
      console.error('Failed to load alerts');
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async (id: number) => {
    try {
      await alertService.resolve(id);
      fetchAlerts();
    } catch (err) {
      console.error('Failed to resolve alert');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">System & Operational Alerts</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Active notifications for food shelf-life limits, sudden spoilage spikes, and high-risk surplus conditions
          </p>
        </div>

        <select
          value={filterResolved}
          onChange={(e) => setFilterResolved(e.target.value)}
          className="text-xs py-1.5 px-3 rounded-lg border border-slate-300 bg-white"
        >
          <option value="false">Active Alerts Only</option>
          <option value="true">Resolved Alerts</option>
          <option value="all">All Alerts</option>
        </select>
      </div>

      {/* Alerts List */}
      <div className="space-y-3.5">
        {loading && alerts.length === 0 ? (
          <div className="py-12 text-center text-slate-400">Loading alerts...</div>
        ) : alerts.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-slate-500">
            <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
            <p className="font-semibold text-slate-800">No active alerts at this time.</p>
            <p className="text-xs text-slate-500 mt-1">All kitchen inventory and surplus metrics are within safe operational parameters.</p>
          </div>
        ) : (
          alerts.map((alert) => (
            <div
              key={alert.id}
              className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-start justify-between gap-4 transition ${
                alert.is_resolved
                  ? 'bg-slate-50 border-slate-200 opacity-60'
                  : alert.severity === 'Critical'
                  ? 'bg-rose-50/60 border-rose-300'
                  : alert.severity === 'Warning'
                  ? 'bg-amber-50/60 border-amber-300'
                  : 'bg-blue-50/60 border-blue-200'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5">
                  {alert.severity === 'Critical' ? (
                    <ShieldAlert className="w-5 h-5 text-rose-600" />
                  ) : alert.severity === 'Warning' ? (
                    <AlertTriangle className="w-5 h-5 text-amber-600" />
                  ) : (
                    <Info className="w-5 h-5 text-blue-600" />
                  )}
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      alert.severity === 'Critical' ? 'bg-rose-200 text-rose-900' : alert.severity === 'Warning' ? 'bg-amber-200 text-amber-900' : 'bg-blue-200 text-blue-900'
                    }`}>
                      {alert.severity}
                    </span>
                    <span className="font-bold text-xs text-slate-800">{alert.alert_type}</span>
                    {alert.food_item_name && (
                      <span className="text-xs font-semibold text-slate-600">
                        • {alert.food_item_name}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-700 mt-1 font-medium">{alert.message}</p>
                  {alert.suggested_action && (
                    <p className="text-xs text-slate-600 mt-2 bg-white/70 p-2 rounded border border-slate-200/50">
                      <strong>Suggested Immediate Next Action:</strong> {alert.suggested_action}
                    </p>
                  )}
                </div>
              </div>

              {!alert.is_resolved && (
                <button
                  onClick={() => handleResolve(alert.id)}
                  className="self-end sm:self-center flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-800 bg-white hover:bg-emerald-50 border border-emerald-300 rounded-lg shadow-xs transition"
                >
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Mark Resolved</span>
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
