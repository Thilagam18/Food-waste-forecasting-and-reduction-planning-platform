import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  Plus,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  User,
  UtensilsCrossed,
  ChefHat,
  X,
  Send,
  Sparkles
} from 'lucide-react';
import { feedbackService, foodItemService } from '../services/api';
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
import { getFoodItemImage } from '../utils/foodImages';

export const Feedback: React.FC = () => {
  const { user } = useAuth();
  const orgName = user?.organization_name || 'Apex Culinary Campus';

  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [foodItems, setFoodItems] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Filters
  const [mealFilter, setMealFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('');

  // Modal
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    staff_name: user?.full_name || 'Service Steward',
    staff_role: 'Steward',
    meal_period: 'Lunch',
    dish_name: '',
    feedback_type: 'Portion Too Large',
    severity: 'Medium',
    comments: ''
  });

  useEffect(() => {
    fetchFoodItems();
  }, []);

  useEffect(() => {
    fetchFeedbacks();
  }, [mealFilter, statusFilter, typeFilter]);

  const fetchFoodItems = async () => {
    try {
      const res = await foodItemService.list();
      if (res.data?.success) setFoodItems(res.data.data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchFeedbacks = async () => {
    setLoading(true);
    try {
      const res = await feedbackService.list({
        meal_period: mealFilter,
        status: statusFilter,
        feedback_type: typeFilter
      });
      if (res.data?.success) setFeedbacks(res.data.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = () => {
    setError(null);
    setFormData({
      staff_name: user?.full_name || 'Staff Member',
      staff_role: 'Steward',
      meal_period: 'Lunch',
      dish_name: foodItems.length > 0 ? foodItems[0].name : 'Steamed Basmati Rice',
      feedback_type: 'Portion Too Large',
      severity: 'Medium',
      comments: ''
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.comments.trim()) {
      setError('Please provide comments or observations.');
      return;
    }

    setSubmitting(true);
    try {
      await feedbackService.create(formData);
      setIsModalOpen(false);
      fetchFeedbacks();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error submitting feedback.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusUpdate = async (id: number, newStatus: string, chefNote?: string) => {
    try {
      await feedbackService.updateStatus(id, {
        status: newStatus,
        chef_action_notes: chefNote || 'Reviewed and addressed by Kitchen Shift Lead.'
      });
      fetchFeedbacks();
    } catch (e) {
      console.error(e);
    }
  };

  const portionFlagsCount = feedbacks.filter(f => f.feedback_type === 'Portion Too Large').length;
  const implementedCount = feedbacks.filter(f => f.status === 'Action Implemented').length;

  return (
    <div className="space-y-5">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
        <span className="text-cyan-700 font-bold">{orgName}</span>
        <span>•</span>
        <span>Staff Floor Feedback Stream</span>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Kitchen & Dining Floor Feedback
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time observations from stewards, floor captains, and diners to pinpoint plate leftovers and adjust batch portion sizes.
          </p>
        </div>

        <button
          onClick={handleOpenModal}
          className="flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold text-white bg-[#1E6BFF] hover:bg-blue-600 rounded-xl shadow-md shadow-blue-500/25 transition"
        >
          <Plus className="w-4 h-4" />
          <span>Log Floor Feedback</span>
        </button>
      </div>

      {/* Intelligence Banner */}
      <div className="bg-[#0D1C38] border border-slate-800/90 rounded-2xl p-5 text-white shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-xl bg-cyan-950 text-cyan-400 border border-cyan-700/60 flex items-center justify-center font-bold text-xs">
              <ChefHat className="w-4 h-4 text-cyan-400" />
            </div>
            <div>
              <h2 className="text-sm font-black text-white leading-none">
                Floor Service & Kitchen Closed-Loop Feedback
              </h2>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Bridging line preparation with customer consumption reality
              </p>
            </div>
          </div>
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#070D1F] text-cyan-300 border border-slate-700">
            Active Feedback Logs
          </span>
        </div>

        {/* 4 Stat Insets */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3.5 mt-4">
          <div className="p-3 bg-[#081226]/80 border border-slate-800/70 rounded-xl">
            <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider block mb-1">Total Notes</span>
            <p className="text-xl font-extrabold text-white">{feedbacks.length}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Logged observations</p>
          </div>

          <div className="p-3 bg-[#081226]/80 border border-slate-800/70 rounded-xl">
            <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider block mb-1">Portion Flags</span>
            <p className="text-xl font-extrabold text-amber-400">{portionFlagsCount}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Ladle sizing warnings</p>
          </div>

          <div className="p-3 bg-[#081226]/80 border border-slate-800/70 rounded-xl">
            <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider block mb-1">Chef Actions Taken</span>
            <p className="text-xl font-extrabold text-emerald-400">{implementedCount}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Calibrated recipes/portions</p>
          </div>

          <div className="p-3 bg-[#081226]/80 border border-slate-800/70 rounded-xl">
            <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider block mb-1">Loop Resolution Rate</span>
            <p className="text-xl font-extrabold text-cyan-400">
              {feedbacks.length > 0 ? `${Math.round((implementedCount / feedbacks.length) * 100)}%` : '100%'}
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">Action compliance</p>
          </div>
        </div>
      </div>

      {/* Visual Feedback Graphical Breakdown */}
      {feedbacks.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Donut Chart: Feedback Issue Types */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900">Floor Waste Observations</h3>
              <p className="text-xs text-slate-400 mb-2">Service team reported patterns</p>
            </div>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Portion Too Large', value: portionFlagsCount || 3, color: '#F59E0B' },
                      { name: 'Taste / Recipe', value: feedbacks.filter(f => f.feedback_type === 'Taste / Spiciness').length || 2, color: '#1E6BFF' },
                      { name: 'Temperature', value: feedbacks.filter(f => f.feedback_type === 'Temperature').length || 1, color: '#00B4D8' },
                      { name: 'Left on Plates', value: feedbacks.filter(f => f.feedback_type === 'Overprep / Leftover').length || 2, color: '#E11D48' }
                    ]}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={68}
                    paddingAngle={3}
                  >
                    {['#F59E0B', '#1E6BFF', '#00B4D8', '#E11D48'].map((color, idx) => (
                      <Cell key={idx} fill={color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '11px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-around text-[10px] font-bold border-t border-slate-100 pt-2 text-slate-600">
              <span className="text-amber-600">Portion ({portionFlagsCount})</span>
              <span className="text-blue-600">Taste ({feedbacks.filter(f => f.feedback_type === 'Taste / Spiciness').length})</span>
              <span className="text-rose-600">Leftover ({feedbacks.filter(f => f.feedback_type === 'Overprep / Leftover').length})</span>
            </div>
          </div>

          {/* BarChart: Feedback by Meal Period */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs lg:col-span-2">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">Shift Feedback Frequency</h3>
                <p className="text-xs text-slate-400">Diner observations recorded by service stewards per shift</p>
              </div>
              <span className="px-2.5 py-1 text-[10px] font-bold bg-cyan-50 text-cyan-800 rounded-lg border border-cyan-200">
                Staff Insights
              </span>
            </div>
            <div className="h-48 mt-1">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={['Breakfast', 'Lunch', 'Snacks', 'Dinner'].map(meal => ({
                    meal,
                    count: feedbacks.filter(f => f.meal_period === meal).length
                  }))}
                  margin={{ top: 5, right: 10, left: -20, bottom: 0 }}
                >
                  <XAxis dataKey="meal" tick={{ fontSize: 11 }} tickLine={false} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '11px' }} />
                  <Bar dataKey="count" fill="#1E6BFF" radius={[5, 5, 0, 0]} name="Reported Items" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs flex flex-wrap gap-3 items-center justify-between">
        <div className="flex flex-wrap gap-3 items-center flex-1">
          <select
            value={mealFilter}
            onChange={(e) => setMealFilter(e.target.value)}
            className="text-xs py-1.5 px-3 rounded-xl border border-slate-300 bg-white font-semibold text-slate-700"
          >
            <option value="">All Meal Periods</option>
            <option value="Breakfast">Breakfast</option>
            <option value="Lunch">Lunch</option>
            <option value="Snacks">Snacks</option>
            <option value="Dinner">Dinner</option>
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="text-xs py-1.5 px-3 rounded-xl border border-slate-300 bg-white font-semibold text-slate-700"
          >
            <option value="">All Feedback Types</option>
            <option value="Portion Too Large">Portion Too Large</option>
            <option value="Taste / Spiciness">Taste / Spiciness</option>
            <option value="Temperature">Temperature</option>
            <option value="Overprep / Leftover">Overprep / Leftover</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs py-1.5 px-3 rounded-xl border border-slate-300 bg-white font-semibold text-slate-700"
          >
            <option value="">All Statuses</option>
            <option value="Pending">Pending Review</option>
            <option value="Reviewed">Reviewed</option>
            <option value="Action Implemented">Action Implemented</option>
          </select>
        </div>

        <div className="text-xs font-bold text-slate-500">
          Showing <span className="text-slate-900">{feedbacks.length}</span> floor notes
        </div>
      </div>

      {/* Feedback Feed Cards with Food Photography */}
      <div className="space-y-3.5">
        {loading ? (
          <div className="py-12 text-center text-slate-400">Loading floor feedback stream...</div>
        ) : feedbacks.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center text-slate-500">
            <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
            <p className="font-bold text-slate-800">No floor feedback items match your filters.</p>
            <p className="text-xs text-slate-400 mt-1">Staff observations logged will appear here in real time.</p>
          </div>
        ) : (
          feedbacks.map((item) => {
            const dishImg = getFoodItemImage(item.dish_name);
            return (
              <div
                key={item.id}
                className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs hover:border-blue-300 transition flex flex-col md:flex-row md:items-start justify-between gap-4"
              >
                <div className="flex items-start gap-4 flex-1">
                  <img
                    src={dishImg}
                    alt={item.dish_name}
                    className="w-14 h-14 rounded-xl object-cover border border-slate-200 shadow-xs flex-shrink-0"
                    onError={(e: any) => {
                      e.target.src = '/images/steamed_basmati_rice.jpg';
                    }}
                  />
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-extrabold text-sm text-slate-900">{item.dish_name}</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                        {item.meal_period}
                      </span>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          item.feedback_type === 'Portion Too Large'
                            ? 'bg-amber-50 text-amber-800 border-amber-300'
                            : item.feedback_type === 'Taste / Spiciness'
                        ? 'bg-rose-50 text-rose-800 border-rose-300'
                        : 'bg-blue-50 text-blue-800 border-blue-300'
                    }`}
                  >
                    {item.feedback_type}
                  </span>
                  <span className="text-[11px] text-slate-400 ml-auto">{item.created_at}</span>
                </div>

                <p className="text-xs text-slate-700 font-medium leading-relaxed bg-slate-50/70 p-3 rounded-xl border border-slate-100">
                  "{item.comments}"
                </p>

                {item.chef_action_notes && (
                  <div className="flex items-start gap-2 bg-emerald-50/60 border border-emerald-200 p-2.5 rounded-xl text-xs text-emerald-900 font-semibold">
                    <ChefHat className="w-4 h-4 text-emerald-700 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="text-[10px] uppercase tracking-wider font-extrabold text-emerald-800 block">Chef / Kitchen Lead Action</span>
                      <span>{item.chef_action_notes}</span>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-3 text-[11px] text-slate-500 font-semibold">
                  <span>Reported by: <strong className="text-slate-800">{item.staff_name}</strong> ({item.staff_role})</span>
                  <span>•</span>
                  <span>Severity: <strong className={item.severity === 'High' ? 'text-rose-600' : 'text-slate-800'}>{item.severity}</strong></span>
                </div>
              </div>

              {/* Status Action Controls */}
              <div className="flex md:flex-col items-center md:items-end justify-between gap-2 flex-shrink-0">
                <span
                  className={`px-2.5 py-1 rounded-full text-xs font-bold border ${
                    item.status === 'Action Implemented'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                      : item.status === 'Reviewed'
                      ? 'bg-blue-50 text-blue-700 border-blue-300'
                      : 'bg-amber-50 text-amber-700 border-amber-300'
                  }`}
                >
                  {item.status}
                </span>

                {item.status !== 'Action Implemented' && (
                  <button
                    onClick={() => handleStatusUpdate(item.id, 'Action Implemented')}
                    className="px-3 py-1 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition"
                  >
                    Mark Addressed
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal to log floor feedback */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200 relative">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="w-9 h-9 rounded-xl bg-[#1E6BFF] text-white flex items-center justify-center shadow-xs">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900">Log Kitchen Floor Feedback</h3>
                <p className="text-xs text-slate-500">Record diner plate leftovers, portion feedback, or dining issues</p>
              </div>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Staff Name</label>
                  <input
                    type="text"
                    required
                    value={formData.staff_name}
                    onChange={(e) => setFormData({ ...formData, staff_name: e.target.value })}
                    className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Staff Role</label>
                  <select
                    value={formData.staff_role}
                    onChange={(e) => setFormData({ ...formData, staff_role: e.target.value })}
                    className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 focus:outline-none focus:border-blue-500 bg-white"
                  >
                    <option value="Steward">Steward / Busser</option>
                    <option value="Floor Captain">Floor Captain / Supervisor</option>
                    <option value="Head Chef">Line Chef</option>
                    <option value="Diner Rep">Diner Representative</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Meal Period</label>
                  <select
                    value={formData.meal_period}
                    onChange={(e) => setFormData({ ...formData, meal_period: e.target.value })}
                    className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 focus:outline-none focus:border-blue-500 bg-white"
                  >
                    <option value="Breakfast">Breakfast</option>
                    <option value="Lunch">Lunch</option>
                    <option value="Snacks">Snacks</option>
                    <option value="Dinner">Dinner</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Dish Name</label>
                  <input
                    type="text"
                    required
                    value={formData.dish_name}
                    onChange={(e) => setFormData({ ...formData, dish_name: e.target.value })}
                    placeholder="e.g. Steamed Rice, Sambar"
                    className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Feedback Category</label>
                  <select
                    value={formData.feedback_type}
                    onChange={(e) => setFormData({ ...formData, feedback_type: e.target.value })}
                    className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 focus:outline-none focus:border-blue-500 bg-white"
                  >
                    <option value="Portion Too Large">Portion Too Large (Left on plate)</option>
                    <option value="Taste / Spiciness">Taste / Spiciness issue</option>
                    <option value="Temperature">Holding Temperature issue</option>
                    <option value="Overprep / Leftover">Unserved Batch Leftover</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Severity / Urgency</label>
                  <select
                    value={formData.severity}
                    onChange={(e) => setFormData({ ...formData, severity: e.target.value })}
                    className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 focus:outline-none focus:border-blue-500 bg-white"
                  >
                    <option value="Low">Low (Informational)</option>
                    <option value="Medium">Medium (Affecting portions)</option>
                    <option value="High">High (High waste volume)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Observations & Comments</label>
                <textarea
                  rows={3}
                  required
                  value={formData.comments}
                  onChange={(e) => setFormData({ ...formData, comments: e.target.value })}
                  placeholder="Detail what diners expressed or why food remained on plates (e.g. portion size was 20% over target)..."
                  className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 text-xs font-bold text-white bg-[#1E6BFF] hover:bg-blue-600 rounded-xl shadow-md shadow-blue-500/25 transition disabled:opacity-50"
                >
                  {submitting ? 'Submitting...' : 'Submit Floor Feedback'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
