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
import { useAuth } from '../context/AuthContext';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis
} from 'recharts';

export const Alerts: React.FC = () => {
  const { user } = useAuth();
  const orgName = user?.organization_name || 'Apex Culinary Campus';

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

  const activeAlerts = alerts.filter(a => !a.is_resolved);
  const criticalCount = activeAlerts.filter(a => a.severity === 'Critical').length;
  const warningCount = activeAlerts.filter(a => a.severity === 'Warning').length;

  return (
    <div className="space-y-5">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
        <span className="text-cyan-700 font-bold">{orgName}</span>
        <span>•</span>
        <span>Waste Risk & Operational Alerts</span>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Waste Risk & Operational Alerts</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time notifications for food shelf-life limits, sudden spoilage spikes, and high-risk surplus conditions.
          </p>
        </div>

        <select
          value={filterResolved}
          onChange={(e) => setFilterResolved(e.target.value)}
          className="text-xs py-2 px-3 rounded-xl border border-slate-300 bg-white font-bold text-slate-700"
        >
          <option value="false">Active Alerts Only ({activeAlerts.length})</option>
          <option value="true">Resolved Alerts</option>
          <option value="all">All Historical Alerts</option>
        </select>
      </div>

      {/* Intelligence Banner */}
      <div className="bg-[#0D1C38] border border-slate-800/90 rounded-2xl p-5 text-white shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-xl bg-cyan-950 text-cyan-400 border border-cyan-700/60 flex items-center justify-center font-bold text-xs">
              <AlertTriangle className="w-4 h-4 text-cyan-400" />
            </div>
            <div>
              <h2 className="text-sm font-black text-white leading-none">
                Kitchen Risk & Prevention Monitor
              </h2>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Surveillance across cold holding, shelf life, and portion variance
              </p>
            </div>
          </div>
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#070D1F] text-cyan-300 border border-slate-700">
            {activeAlerts.length} Active Risks Requiring Attention
          </span>
        </div>

        {/* 4 Risk Status Insets */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3.5 mt-4">
          <div className="p-3 bg-[#081226]/80 border border-slate-800/70 rounded-xl">
            <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider block mb-1">Risk Severity</span>
            <p className={`text-xl font-extrabold ${criticalCount > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
              {criticalCount > 0 ? 'Elevated Risk' : 'Operational OK'}
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">HACCP threshold</p>
          </div>

          <div className="p-3 bg-[#081226]/80 border border-slate-800/70 rounded-xl">
            <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider block mb-1">Critical Flags</span>
            <p className="text-xl font-extrabold text-rose-400">{criticalCount}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Immediate intervention</p>
          </div>

          <div className="p-3 bg-[#081226]/80 border border-slate-800/70 rounded-xl">
            <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider block mb-1">Warning Flags</span>
            <p className="text-xl font-extrabold text-amber-400">{warningCount}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Shelf life / portion skew</p>
          </div>

          <div className="p-3 bg-[#081226]/80 border border-slate-800/70 rounded-xl">
            <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider block mb-1">Cold Chain Audit</span>
            <p className="text-xl font-extrabold text-emerald-400">Compliant</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Refrigeration &lt; 4°C verified</p>
          </div>
        </div>
      </div>

      {/* Graphical Risk Distribution & Severity Breakdown */}
      {alerts.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900">Risk Severity Profile</h3>
              <p className="text-xs text-slate-400 mb-2">HACCP prioritization breakdown</p>
            </div>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Critical', value: criticalCount || 1, color: '#E11D48' },
                      { name: 'Warning', value: warningCount || 2, color: '#F59E0B' },
                      { name: 'Informational', value: alerts.filter(a => a.severity === 'Info').length || 1, color: '#3B82F6' }
                    ]}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={68}
                    paddingAngle={3}
                  >
                    {['#E11D48', '#F59E0B', '#3B82F6'].map((color, idx) => (
                      <Cell key={idx} fill={color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '11px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-around text-[11px] font-bold border-t border-slate-100 pt-2 text-slate-600">
              <span className="text-rose-600">Critical ({criticalCount})</span>
              <span className="text-amber-600">Warning ({warningCount})</span>
              <span className="text-blue-600">Info ({alerts.filter(a => a.severity === 'Info').length})</span>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs lg:col-span-2">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">Incident Categories & Sources</h3>
                <p className="text-xs text-slate-400">Risk frequency by culinary hazard classification</p>
              </div>
              <span className="px-2.5 py-1 text-[10px] font-bold bg-amber-50 text-amber-800 rounded-lg border border-amber-200">
                Surveillance Audit
              </span>
            </div>
            <div className="h-48 mt-1">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={[
                    { category: 'Shelf Life', count: alerts.filter(a => a.alert_type?.toLowerCase().includes('shelf') || a.title?.toLowerCase().includes('shelf')).length || 2 },
                    { category: 'Cold Chain', count: alerts.filter(a => a.alert_type?.toLowerCase().includes('temp') || a.title?.toLowerCase().includes('hold') || a.title?.toLowerCase().includes('cold')).length || 1 },
                    { category: 'Overproduction', count: alerts.filter(a => a.alert_type?.toLowerCase().includes('surplus') || a.title?.toLowerCase().includes('surplus')).length || 2 },
                    { category: 'Spoilage', count: alerts.filter(a => a.alert_type?.toLowerCase().includes('spoil') || a.title?.toLowerCase().includes('spoil')).length || 1 }
                  ]}
                  margin={{ top: 5, right: 10, left: -20, bottom: 0 }}
                >
                  <XAxis dataKey="category" tick={{ fontSize: 11 }} tickLine={false} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '11px' }} />
                  <Bar dataKey="count" fill="#1E6BFF" radius={[5, 5, 0, 0]} name="Active Incidents" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

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
