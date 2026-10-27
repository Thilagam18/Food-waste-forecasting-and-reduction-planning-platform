import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  RefreshCw,
  CheckCircle2,
  Clock,
  XCircle,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  DollarSign,
  Trash2,
  X,
  FileCheck2
} from 'lucide-react';
import { recommendationService } from '../services/api';

export const Recommendations: React.FC = () => {
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [priorityFilter, setPriorityFilter] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Intervention Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [selectedRec, setSelectedRec] = useState<any | null>(null);
  const [actionTaken, setActionTaken] = useState<string>('');
  const [foodSavedKg, setFoodSavedKg] = useState<string>('');
  const [costSaved, setCostSaved] = useState<string>('');
  const [staffNotes, setStaffNotes] = useState<string>('');
  const [modalSubmitting, setModalSubmitting] = useState<boolean>(false);
  const [modalError, setModalError] = useState<string | null>(null);

  useEffect(() => {
    fetchRecommendations();
  }, [statusFilter, priorityFilter]);

  const fetchRecommendations = async () => {
    setLoading(true);
    try {
      const res = await recommendationService.list({
        status: statusFilter,
        priority: priorityFilter
      });
      if (res.data?.success) {
        setRecommendations(res.data.data);
        setSummary(res.data.summary);
      }
    } catch (err) {
      console.error('Failed to fetch recommendations');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await recommendationService.refresh();
      await fetchRecommendations();
    } catch (err) {
      console.error('Failed to refresh recommendations');
    } finally {
      setRefreshing(false);
    }
  };

  const handleStatusChange = async (id: number, newStatus: string) => {
    try {
      await recommendationService.updateStatus(id, newStatus);
      fetchRecommendations();
    } catch (err) {
      console.error('Failed to update status');
    }
  };

  const handleOpenInterveneModal = (rec: any) => {
    setSelectedRec(rec);
    setActionTaken('');
    setFoodSavedKg(String(rec.potential_waste_reduction_kg || ''));
    setCostSaved(String(rec.potential_savings_cost || ''));
    setStaffNotes('');
    setModalError(null);
    setIsModalOpen(true);
  };

  const handleSubmitIntervention = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actionTaken.trim()) {
      setModalError('Please specify the action taken.');
      return;
    }

    setModalSubmitting(true);
    try {
      await recommendationService.recordIntervention(selectedRec.id, {
        action_taken: actionTaken.trim(),
        food_saved_kg: parseFloat(foodSavedKg) || 0,
        cost_saved: parseFloat(costSaved) || 0,
        staff_notes: staffNotes.trim()
      });
      setIsModalOpen(false);
      fetchRecommendations();
    } catch (err: any) {
      setModalError(err.response?.data?.message || 'Error recording intervention outcome.');
    } finally {
      setModalSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Surplus Analysis & Intelligent Reduction Planning</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Prescriptive intelligence for batch sizing, storage auditing, portion control, and verified surplus food redistribution
          </p>
        </div>

        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-sm transition disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          <span>{refreshing ? 'Analyzing Operations...' : 'Re-Run Surplus Analysis'}</span>
        </button>
      </div>

      {/* KPI Highlights Bar */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="card-glass p-4 rounded-xl">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Action Items</span>
            <p className="mt-1 text-2xl font-extrabold text-slate-900">{summary.total_pending_or_in_progress}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Pending or in-progress interventions</p>
          </div>
          <div className="card-glass p-4 rounded-xl">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Identified Financial Savings</span>
            <p className="mt-1 text-2xl font-extrabold text-emerald-700">${summary.total_potential_savings}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Cumulative monthly recoverable waste cost</p>
          </div>
          <div className="card-glass p-4 rounded-xl">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Potential Waste Diverted</span>
            <p className="mt-1 text-2xl font-extrabold text-blue-700">{summary.total_potential_reduction_kg} <span className="text-xs font-normal text-slate-500">kg</span></p>
            <p className="text-[11px] text-slate-500 mt-0.5">Avoidable discards through planned adjustments</p>
          </div>
        </div>
      )}

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap gap-3 items-center justify-between">
        <div className="flex flex-wrap gap-3 items-center">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs py-1.5 px-3 rounded-lg border border-slate-300 bg-white"
          >
            <option value="">All Action Statuses</option>
            <option value="Pending">Pending</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
            <option value="Dismissed">Dismissed</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="text-xs py-1.5 px-3 rounded-lg border border-slate-300 bg-white"
          >
            <option value="">All Priority Levels</option>
            <option value="High">High Priority</option>
            <option value="Medium">Medium Priority</option>
            <option value="Low">Low Priority</option>
          </select>
        </div>

        <span className="text-xs text-slate-500 font-medium">
          Total Recommendations: <strong>{recommendations.length}</strong>
        </span>
      </div>

      {/* Recommendations Cards Grid */}
      <div className="space-y-4">
        {loading && recommendations.length === 0 ? (
          <div className="py-12 text-center text-slate-400">Loading operational recommendations...</div>
        ) : recommendations.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-slate-500">
            No recommendations match your current filters. Click <strong>"Re-Run Surplus Analysis"</strong> to scan historical records for optimization opportunities.
          </div>
        ) : (
          recommendations.map((rec) => (
            <div key={rec.id} className="card-glass p-5 rounded-xl border border-slate-200 flex flex-col md:flex-row md:items-start justify-between gap-5">
              <div className="flex-1 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                    rec.priority === 'High' ? 'bg-rose-100 text-rose-800 border border-rose-300' : 'bg-amber-100 text-amber-800 border border-amber-300'
                  }`}>
                    {rec.priority} Priority
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                    Category: {rec.category}
                  </span>
                  <span className="text-xs text-slate-400">Generated: {rec.date_generated}</span>
                </div>

                <h3 className="text-base font-bold text-slate-900 leading-snug">{rec.title}</h3>
                <p className="text-xs text-slate-700 leading-relaxed font-medium">{rec.recommendation_text}</p>

                {rec.category === 'Donation' && (
                  <div className="p-3 bg-amber-50 border border-amber-300 rounded-lg text-xs text-amber-900 flex items-start gap-2.5">
                    <ShieldCheck className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
                    <div>
                      <strong>Mandatory Food Safety Checklist:</strong> Kitchen team must verify hot-holding temperature (≥60°C) or rapid chilled temperature (≤4°C), inspect sensory freshness, and verify handling duration (&lt;2 hours) before surplus redistribution dispatch.
                    </div>
                  </div>
                )}

                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200/60 text-xs text-slate-600">
                  <span className="font-semibold text-slate-800">Operational Evidence:</span> {rec.reason}
                  {rec.supporting_data && (
                    <span className="block text-[11px] text-slate-500 mt-1 font-mono">{rec.supporting_data}</span>
                  )}
                </div>

                {rec.action_notes && (
                  <p className="text-xs text-emerald-800 bg-emerald-50/70 p-2 rounded border border-emerald-200">
                    <strong>Logged Action:</strong> {rec.action_notes}
                  </p>
                )}
              </div>

              {/* Action Controls & Value Column */}
              <div className="flex flex-col md:items-end justify-between self-stretch min-w-[200px] border-t md:border-t-0 md:border-l border-slate-200 pt-3 md:pt-0 md:pl-5 space-y-3">
                <div className="text-left md:text-right">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Estimated Benefit</span>
                  <span className="text-lg font-extrabold text-emerald-700">${rec.potential_savings_cost}</span>
                  <span className="block text-xs text-slate-600">{rec.potential_waste_reduction_kg} kg waste cut</span>
                </div>

                <div className="w-full space-y-2">
                  <div className="flex items-center gap-1.5 w-full">
                    {rec.status === 'Pending' && (
                      <button
                        onClick={() => handleStatusChange(rec.id, 'In Progress')}
                        className="flex-1 px-3 py-1.5 text-xs font-semibold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-300 rounded-lg transition"
                      >
                        Start Action
                      </button>
                    )}
                    {rec.status !== 'Completed' && (
                      <button
                        onClick={() => handleOpenInterveneModal(rec)}
                        className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-sm transition"
                      >
                        <FileCheck2 className="w-3.5 h-3.5" />
                        <span>Log Outcome</span>
                      </button>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>Status: <strong className="text-slate-800">{rec.status}</strong></span>
                    {rec.status !== 'Dismissed' && rec.status !== 'Completed' && (
                      <button
                        onClick={() => handleStatusChange(rec.id, 'Dismissed')}
                        className="text-[11px] text-slate-400 hover:text-slate-600 underline"
                      >
                        Dismiss
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Log Intervention Outcome Modal */}
      {isModalOpen && selectedRec && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="font-bold text-base text-slate-900">Record Intervention & Food Saved</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {modalError && (
              <div className="mt-3 p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-lg flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            <form className="mt-4 space-y-3.5" onSubmit={handleSubmitIntervention}>
              <div className="p-3 bg-slate-50 rounded-lg text-xs border border-slate-200">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Related Plan</span>
                <p className="font-semibold text-slate-800 mt-0.5">{selectedRec.title}</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">Specific Action Implemented *</label>
                <textarea
                  required
                  rows={2}
                  value={actionTaken}
                  onChange={(e) => setActionTaken(e.target.value)}
                  placeholder="e.g. Reduced rice batch cooking volume by 6 kg starting from Tuesday lunch."
                  className="mt-1 block w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700">Verified Food Saved (kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={foodSavedKg}
                    onChange={(e) => setFoodSavedKg(e.target.value)}
                    className="mt-1 block w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-bold text-emerald-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700">Financial Cost Saved ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={costSaved}
                    onChange={(e) => setCostSaved(e.target.value)}
                    className="mt-1 block w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-bold text-emerald-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">Kitchen Staff Observation Notes</label>
                <textarea
                  rows={2}
                  value={staffNotes}
                  onChange={(e) => setStaffNotes(e.target.value)}
                  placeholder="e.g. Diner queues were smooth and food waste tubs remained empty."
                  className="mt-1 block w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalSubmitting}
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-sm transition disabled:opacity-50"
                >
                  {modalSubmitting ? 'Recording...' : 'Complete & Record Outcome'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
