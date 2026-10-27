import React, { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  AlertCircle,
  X,
  CheckCircle2,
  Calendar,
  UtensilsCrossed
} from 'lucide-react';
import { foodLogService, foodItemService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { getFoodItemImage } from '../utils/foodImages';

export const DailyLog: React.FC = () => {
  const { user } = useAuth();
  const orgName = user?.organization_name || 'Apex Culinary Campus';
  const [logs, setLogs] = useState<any[]>([]);
  const [foodItems, setFoodItems] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);

  // Filters
  const [search, setSearch] = useState<string>('');
  const [mealPeriod, setMealPeriod] = useState<string>('');
  const [wasteReason, setWasteReason] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Form Fields
  const [formData, setFormData] = useState({
    food_item_id: '',
    record_date: new Date().toISOString().split('T')[0],
    meal_period: 'Lunch',
    quantity_prepared: '',
    quantity_consumed: '',
    surplus_quantity: '',
    discarded_quantity: '0',
    unit_cost: '',
    waste_reason: 'None',
    notes: ''
  });

  useEffect(() => {
    fetchFoodItems();
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [page, mealPeriod, wasteReason, startDate, endDate]);

  const fetchFoodItems = async () => {
    try {
      const res = await foodItemService.list();
      if (res.data?.success) setFoodItems(res.data.data);
    } catch (err) {
      console.error('Failed to fetch food items');
    }
  };

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await foodLogService.list({
        page,
        per_page: 15,
        search,
        meal_period: mealPeriod,
        waste_reason: wasteReason,
        start_date: startDate,
        end_date: endDate
      });
      if (res.data?.success) {
        setLogs(res.data.data);
        setTotalPages(res.data.pages || 1);
        setTotalCount(res.data.total || 0);
      }
    } catch (err) {
      console.error('Failed to fetch food logs');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAddModal = () => {
    setEditingId(null);
    setFormError(null);
    setFormData({
      food_item_id: foodItems.length > 0 ? String(foodItems[0].id) : '',
      record_date: new Date().toISOString().split('T')[0],
      meal_period: 'Lunch',
      quantity_prepared: '',
      quantity_consumed: '',
      surplus_quantity: '',
      discarded_quantity: '0',
      unit_cost: foodItems.length > 0 ? String(foodItems[0].default_unit_cost) : '',
      waste_reason: 'None',
      notes: ''
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (log: any) => {
    setEditingId(log.id);
    setFormError(null);
    setFormData({
      food_item_id: String(log.food_item_id),
      record_date: log.record_date,
      meal_period: log.meal_period,
      quantity_prepared: String(log.quantity_prepared),
      quantity_consumed: String(log.quantity_consumed),
      surplus_quantity: String(log.surplus_quantity),
      discarded_quantity: String(log.discarded_quantity),
      unit_cost: String(log.unit_cost),
      waste_reason: log.waste_reason,
      notes: log.notes || ''
    });
    setIsModalOpen(true);
  };

  const handleItemSelectChange = (itemIdStr: string) => {
    const selectedItem = foodItems.find(it => String(it.id) === itemIdStr);
    setFormData({
      ...formData,
      food_item_id: itemIdStr,
      unit_cost: selectedItem ? String(selectedItem.default_unit_cost) : formData.unit_cost
    });
  };

  // Auto-calculate surplus when prepared and consumed change
  const handlePrepChange = (prepVal: string) => {
    const prep = parseFloat(prepVal) || 0;
    const consumed = parseFloat(formData.quantity_consumed) || 0;
    const surplus = Math.max(0, prep - consumed);
    setFormData({
      ...formData,
      quantity_prepared: prepVal,
      surplus_quantity: surplus > 0 ? surplus.toFixed(1) : '0'
    });
  };

  const handleConsumedChange = (consumedVal: string) => {
    const consumed = parseFloat(consumedVal) || 0;
    const prep = parseFloat(formData.quantity_prepared) || 0;
    const surplus = Math.max(0, prep - consumed);
    setFormData({
      ...formData,
      quantity_consumed: consumedVal,
      surplus_quantity: surplus > 0 ? surplus.toFixed(1) : '0'
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const prep = parseFloat(formData.quantity_prepared);
    const consumed = parseFloat(formData.quantity_consumed);
    const discarded = parseFloat(formData.discarded_quantity);

    if (isNaN(prep) || prep < 0) {
      setFormError('Prepared quantity must be a positive number.');
      return;
    }
    if (isNaN(consumed) || consumed < 0) {
      setFormError('Consumed quantity must be a positive number.');
      return;
    }
    if (consumed > prep) {
      setFormError('Consumed quantity cannot exceed prepared quantity.');
      return;
    }
    if (discarded > prep) {
      setFormError('Discarded quantity cannot exceed prepared quantity.');
      return;
    }

    setSubmitting(true);
    try {
      if (editingId) {
        await foodLogService.update(editingId, {
          quantity_prepared: prep,
          quantity_consumed: consumed,
          discarded_quantity: discarded,
          unit_cost: parseFloat(formData.unit_cost) || 0,
          meal_period: formData.meal_period,
          waste_reason: formData.waste_reason,
          notes: formData.notes
        });
      } else {
        await foodLogService.create({
          food_item_id: parseInt(formData.food_item_id),
          record_date: formData.record_date,
          meal_period: formData.meal_period,
          quantity_prepared: prep,
          quantity_consumed: consumed,
          surplus_quantity: parseFloat(formData.surplus_quantity) || 0,
          discarded_quantity: discarded,
          unit_cost: parseFloat(formData.unit_cost) || 0,
          waste_reason: formData.waste_reason,
          notes: formData.notes
        });
      }
      setIsModalOpen(false);
      fetchLogs();
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Error saving food record.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!window.confirm(`Are you sure you want to delete the record for ${name}?`)) return;
    try {
      await foodLogService.delete(id);
      fetchLogs();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete record.');
    }
  };

  const sumPrep = logs.reduce((a, b) => a + (Number(b.quantity_prepared) || 0), 0);
  const sumCons = logs.reduce((a, b) => a + (Number(b.quantity_consumed) || 0), 0);
  const sumWaste = logs.reduce((a, b) => a + (Number(b.discarded_quantity) || 0), 0);
  const sumCost = logs.reduce((a, b) => a + (Number(b.waste_cost) || 0), 0);

  return (
    <div className="space-y-5">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
        <span className="text-cyan-700 font-bold">{orgName}</span>
        <span>•</span>
        <span>Waste Data Logs & Preparation Tracking</span>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Daily Kitchen Waste & Prep Logs</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Log preparation batches, diner consumption, unserved surplus, and discarded waste with root-cause categorization.
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold text-white bg-[#1E6BFF] hover:bg-blue-600 rounded-xl shadow-md shadow-blue-500/25 transition"
        >
          <Plus className="w-4 h-4" />
          <span>Log Daily Service</span>
        </button>
      </div>

      {/* 5-Column Intelligence Banner */}
      <div className="bg-[#0D1C38] border border-slate-800/90 rounded-2xl p-5 text-white shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-xl bg-cyan-950 text-cyan-400 border border-cyan-700/60 flex items-center justify-center font-bold text-xs">
              <UtensilsCrossed className="w-4 h-4 text-cyan-400" />
            </div>
            <div>
              <h2 className="text-sm font-black text-white leading-none">
                Service Waste & Discard Tracking Summary
              </h2>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Current filter batch operational aggregates
              </p>
            </div>
          </div>
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#070D1F] text-cyan-300 border border-slate-700">
            {totalCount} Total Logged Records
          </span>
        </div>

        {/* 4 Summary Insets */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3.5 mt-4">
          <div className="p-3 bg-[#081226]/80 border border-slate-800/70 rounded-xl">
            <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider block mb-1">Total Prepared</span>
            <p className="text-xl font-extrabold text-white">{sumPrep.toLocaleString('en-IN', { maximumFractionDigits: 1 })} kg</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Batch production volume</p>
          </div>

          <div className="p-3 bg-[#081226]/80 border border-slate-800/70 rounded-xl">
            <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider block mb-1">Total Consumed</span>
            <p className="text-xl font-extrabold text-cyan-400">{sumCons.toLocaleString('en-IN', { maximumFractionDigits: 1 })} kg</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Customer consumption</p>
          </div>

          <div className="p-3 bg-[#081226]/80 border border-slate-800/70 rounded-xl">
            <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider block mb-1">Total Discarded</span>
            <p className="text-xl font-extrabold text-rose-400">{sumWaste.toLocaleString('en-IN', { maximumFractionDigits: 1 })} kg</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Discard waste rate: {sumPrep > 0 ? `${((sumWaste / sumPrep) * 100).toFixed(1)}%` : '0%'}</p>
          </div>

          <div className="p-3 bg-[#081226]/80 border border-slate-800/70 rounded-xl">
            <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider block mb-1">Direct Cost Lost</span>
            <p className="text-xl font-extrabold text-amber-400">₹{sumCost.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Raw material loss</p>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap gap-3 items-center justify-between">
        <div className="flex flex-wrap gap-3 items-center flex-1">
          {/* Search */}
          <div className="relative min-w-[200px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search food item..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchLogs()}
              className="pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500 w-full"
            />
          </div>

          {/* Meal Period Filter */}
          <select
            value={mealPeriod}
            onChange={(e) => setMealPeriod(e.target.value)}
            className="text-xs py-1.5 px-2.5 rounded-lg border border-slate-300 bg-white"
          >
            <option value="">All Meal Periods</option>
            <option value="Breakfast">Breakfast</option>
            <option value="Lunch">Lunch</option>
            <option value="Snacks">Snacks</option>
            <option value="Dinner">Dinner</option>
          </select>

          {/* Waste Reason Filter */}
          <select
            value={wasteReason}
            onChange={(e) => setWasteReason(e.target.value)}
            className="text-xs py-1.5 px-2.5 rounded-lg border border-slate-300 bg-white"
          >
            <option value="">All Waste Reasons</option>
            <option value="Overproduction">Overproduction</option>
            <option value="Low Demand">Low Demand</option>
            <option value="Spoilage">Spoilage</option>
            <option value="Expiry">Expiry</option>
            <option value="Preparation Error">Preparation Error</option>
            <option value="Plate Waste">Plate Waste</option>
          </select>

          {/* Start Date */}
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="text-xs py-1.5 px-2 rounded-lg border border-slate-300"
            title="Start Date"
          />

          {/* End Date */}
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="text-xs py-1.5 px-2 rounded-lg border border-slate-300"
            title="End Date"
          />
        </div>

        <div className="text-xs text-slate-500 font-medium">
          Showing <strong>{logs.length}</strong> of <strong>{totalCount}</strong> records
        </div>
      </div>

      {/* Records Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider">
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Food Item</th>
                <th className="py-3 px-4">Meal Period</th>
                <th className="py-3 px-4 text-right">Prepared</th>
                <th className="py-3 px-4 text-right">Consumed</th>
                <th className="py-3 px-4 text-right">Surplus</th>
                <th className="py-3 px-4 text-right">Discarded</th>
                <th className="py-3 px-4 text-right">Cost (₹)</th>
                <th className="py-3 px-4">Waste Reason</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading && logs.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-400">Loading food records...</td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-500">
                    No matching food records found. Click <strong>"Log Daily Service"</strong> to create a record.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3 px-4 font-medium text-slate-900">{log.record_date}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={getFoodItemImage(log.food_item_name, log.category)}
                          alt={log.food_item_name}
                          className="w-10 h-10 rounded-lg object-cover border border-slate-200 flex-shrink-0"
                          onError={(e: any) => {
                            e.target.src = '/images/steamed_basmati_rice.jpg';
                          }}
                        />
                        <div>
                          <span className="font-semibold text-slate-900 block leading-tight">{log.food_item_name}</span>
                          <span className="text-[10px] text-slate-500">{log.category}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700">
                        {log.meal_period}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-semibold text-slate-800">
                      {log.quantity_prepared} <span className="text-[10px] font-normal text-slate-500">{log.unit}</span>
                    </td>
                    <td className="py-3 px-4 text-right text-slate-700">
                      {log.quantity_consumed} <span className="text-[10px] font-normal text-slate-500">{log.unit}</span>
                    </td>
                    <td className="py-3 px-4 text-right font-medium text-amber-700">
                      {log.surplus_quantity} <span className="text-[10px] font-normal text-slate-500">{log.unit}</span>
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-rose-700">
                      {log.discarded_quantity} <span className="text-[10px] font-normal text-slate-500">{log.unit}</span>
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-slate-900">
                      ₹{log.waste_cost}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                        log.waste_reason === 'Overproduction'
                          ? 'bg-amber-50 text-amber-800 border border-amber-200'
                          : log.waste_reason === 'Spoilage' || log.waste_reason === 'Expiry'
                          ? 'bg-rose-50 text-rose-800 border border-rose-200'
                          : log.waste_reason === 'Plate Waste'
                          ? 'bg-purple-50 text-purple-800 border border-purple-200'
                          : 'bg-slate-50 text-slate-600'
                      }`}>
                        {log.waste_reason}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleOpenEditModal(log)}
                          className="p-1 text-slate-500 hover:text-emerald-700 hover:bg-slate-100 rounded"
                          title="Edit Record"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(log.id, log.food_item_name)}
                          className="p-1 text-slate-500 hover:text-rose-700 hover:bg-slate-100 rounded"
                          title="Delete Record"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="p-3 border-t border-slate-200 flex items-center justify-between text-xs bg-slate-50">
            <button
              disabled={page <= 1}
              onClick={() => setPage(p => Math.max(1, p - 1))}
              className="px-3 py-1 bg-white border border-slate-300 rounded font-medium disabled:opacity-40"
            >
              Previous
            </button>
            <span className="text-slate-600">Page {page} of {totalPages}</span>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              className="px-3 py-1 bg-white border border-slate-300 rounded font-medium disabled:opacity-40"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Add / Edit Modal Dialog */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="font-bold text-base text-slate-900">
                {editingId ? 'Edit Daily Food Record' : 'Record Daily Food Preparation & Waste'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="mt-3 p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-lg flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form className="mt-4 space-y-3.5" onSubmit={handleSubmit}>
              {/* Food Item Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-700">Food Item *</label>
                <select
                  disabled={!!editingId}
                  value={formData.food_item_id}
                  onChange={(e) => handleItemSelectChange(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white"
                  required
                >
                  {foodItems.map(it => (
                    <option key={it.id} value={it.id}>
                      {it.name} ({it.category} - {it.unit})
                    </option>
                  ))}
                </select>
              </div>

              {/* Date & Meal Period */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700">Record Date *</label>
                  <input
                    type="date"
                    disabled={!!editingId}
                    required
                    value={formData.record_date}
                    onChange={(e) => setFormData({ ...formData, record_date: e.target.value })}
                    className="mt-1 block w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700">Meal Period *</label>
                  <select
                    value={formData.meal_period}
                    onChange={(e) => setFormData({ ...formData, meal_period: e.target.value })}
                    className="mt-1 block w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white"
                  >
                    <option value="Breakfast">Breakfast</option>
                    <option value="Lunch">Lunch</option>
                    <option value="Snacks">Snacks</option>
                    <option value="Dinner">Dinner</option>
                  </select>
                </div>
              </div>

              {/* Quantities: Prepared vs Consumed */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700">Quantity Prepared *</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    required
                    value={formData.quantity_prepared}
                    onChange={(e) => handlePrepChange(e.target.value)}
                    placeholder="e.g. 25.0"
                    className="mt-1 block w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700">Quantity Consumed *</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    required
                    value={formData.quantity_consumed}
                    onChange={(e) => handleConsumedChange(e.target.value)}
                    placeholder="e.g. 21.5"
                    className="mt-1 block w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
              </div>

              {/* Surplus & Discarded */}
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <div>
                  <label className="block text-xs font-semibold text-amber-800">Unserved Surplus</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={formData.surplus_quantity}
                    onChange={(e) => setFormData({ ...formData, surplus_quantity: e.target.value })}
                    placeholder="Auto-calculated"
                    className="mt-1 block w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white"
                  />
                  <span className="text-[10px] text-slate-400">Available for chilled storage/rescue</span>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-rose-800">Discarded Waste *</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    required
                    value={formData.discarded_quantity}
                    onChange={(e) => setFormData({ ...formData, discarded_quantity: e.target.value })}
                    placeholder="e.g. 1.5"
                    className="mt-1 block w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white font-bold text-rose-700"
                  />
                  <span className="text-[10px] text-slate-400">Amount actually thrown away</span>
                </div>
              </div>

              {/* Waste Reason & Unit Cost */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700">Primary Waste Reason</label>
                  <select
                    value={formData.waste_reason}
                    onChange={(e) => setFormData({ ...formData, waste_reason: e.target.value })}
                    className="mt-1 block w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white"
                  >
                    <option value="None">None (Zero Waste)</option>
                    <option value="Overproduction">Overproduction</option>
                    <option value="Low Demand">Low Demand</option>
                    <option value="Spoilage">Spoilage</option>
                    <option value="Expiry">Expiry</option>
                    <option value="Preparation Error">Preparation Error</option>
                    <option value="Plate Waste">Plate Waste</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700">Unit Cost (₹ per unit)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.unit_cost}
                    onChange={(e) => setFormData({ ...formData, unit_cost: e.target.value })}
                    placeholder="e.g. 60.00"
                    className="mt-1 block w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-700">Operational Notes</label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="e.g. Rainstorm lowered campus traffic; kitchen stored 3kg curry in blast chiller."
                  className="mt-1 block w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs"
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
                  disabled={submitting}
                  className="px-5 py-2 text-xs font-bold text-white bg-[#1E6BFF] hover:bg-blue-600 rounded-xl shadow-md shadow-blue-500/25 transition disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : editingId ? 'Update Record' : 'Save Food Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
