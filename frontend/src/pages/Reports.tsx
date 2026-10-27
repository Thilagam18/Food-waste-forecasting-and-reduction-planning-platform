import React, { useState, useEffect } from 'react';
import {
  FileText,
  Download,
  Filter,
  Calendar,
  Layers,
  Printer,
  Table,
  BarChart2,
  CheckCircle2
} from 'lucide-react';
import { reportService, foodItemService } from '../services/api';

export const Reports: React.FC = () => {
  const [reportData, setReportData] = useState<any>(null);
  const [foodItems, setFoodItems] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Filters
  const [startDate, setStartDate] = useState<string>(
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [category, setCategory] = useState<string>('');
  const [mealPeriod, setMealPeriod] = useState<string>('');

  useEffect(() => {
    fetchFoodItems();
  }, []);

  useEffect(() => {
    fetchReport();
  }, [startDate, endDate, category, mealPeriod]);

  const fetchFoodItems = async () => {
    try {
      const res = await foodItemService.list();
      if (res.data?.success) setFoodItems(res.data.data);
    } catch (err) {
      console.error('Failed to load food items');
    }
  };

  const fetchReport = async () => {
    setLoading(true);
    try {
      const res = await reportService.getSummary({
        start_date: startDate,
        end_date: endDate,
        category,
        meal_period: mealPeriod
      });
      if (res.data?.success) setReportData(res.data);
    } catch (err) {
      console.error('Failed to load report summary');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadCSV = () => {
    const url = reportService.getExportUrl(startDate, endDate);
    window.open(url, '_blank');
  };

  const handlePrint = () => {
    window.print();
  };

  const totals = reportData?.totals;
  const categories = reportData?.category_breakdown || [];
  const mealPeriods = reportData?.meal_period_breakdown || [];
  const records = reportData?.records || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Audit Reports & Data Export</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Operational food prep audits, category discards, cost breakdowns, and CSV reporting exports
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg shadow-xs transition"
          >
            <Printer className="w-4 h-4 text-slate-500" />
            <span>Print View</span>
          </button>
          <button
            onClick={handleDownloadCSV}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-sm transition"
          >
            <Download className="w-4 h-4" />
            <span>Download CSV Audit Log</span>
          </button>
        </div>
      </div>

      {/* Filter Parameters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap gap-4 items-center">
        <div>
          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">From Date</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="text-xs py-1.5 px-2.5 rounded-lg border border-slate-300"
          />
        </div>

        <div>
          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">To Date</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="text-xs py-1.5 px-2.5 rounded-lg border border-slate-300"
          />
        </div>

        <div>
          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Food Category</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="text-xs py-1.5 px-3 rounded-lg border border-slate-300 bg-white"
          >
            <option value="">All Categories</option>
            <option value="Cooked Meals">Cooked Meals</option>
            <option value="Bakery & Bread">Bakery & Bread</option>
            <option value="Produce & Salads">Produce & Salads</option>
            <option value="Meat & Poultry">Meat & Poultry</option>
            <option value="Dairy & Desserts">Dairy & Desserts</option>
            <option value="Grains & Staples">Grains & Staples</option>
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Meal Period</label>
          <select
            value={mealPeriod}
            onChange={(e) => setMealPeriod(e.target.value)}
            className="text-xs py-1.5 px-3 rounded-lg border border-slate-300 bg-white"
          >
            <option value="">All Meal Periods</option>
            <option value="Breakfast">Breakfast</option>
            <option value="Lunch">Lunch</option>
            <option value="Snacks">Snacks</option>
            <option value="Dinner">Dinner</option>
          </select>
        </div>
      </div>

      {/* Summary Totals Cards */}
      {totals && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="card-glass p-4 rounded-xl">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Filtered Prep</span>
            <p className="mt-1 text-2xl font-extrabold text-slate-900">{totals.total_prepared_kg} <span className="text-xs font-normal text-slate-500">kg</span></p>
            <p className="text-[11px] text-slate-500 mt-0.5">{totals.records_count} records</p>
          </div>
          <div className="card-glass p-4 rounded-xl">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Filtered Waste</span>
            <p className="mt-1 text-2xl font-extrabold text-rose-700">{totals.total_waste_kg} <span className="text-xs font-normal text-slate-500">kg</span></p>
            <p className="text-[11px] text-slate-500 mt-0.5">Discarded weight</p>
          </div>
          <div className="card-glass p-4 rounded-xl">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Waste Loss ($)</span>
            <p className="mt-1 text-2xl font-extrabold text-rose-700">${totals.total_cost}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Procurement value discarded</p>
          </div>
          <div className="card-glass p-4 rounded-xl">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Waste Percentage</span>
            <p className="mt-1 text-2xl font-extrabold text-slate-900">{totals.waste_percentage}%</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Of prepared mass</p>
          </div>
        </div>
      )}

      {/* Category Breakdown Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200">
          <h3 className="font-bold text-sm text-slate-900">Waste & Cost Summary by Food Category</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider">
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4 text-right">Prepared (kg)</th>
                <th className="py-3 px-4 text-right">Consumed (kg)</th>
                <th className="py-3 px-4 text-right">Discarded (kg)</th>
                <th className="py-3 px-4 text-right">Waste Rate (%)</th>
                <th className="py-3 px-4 text-right">Cost ($)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {categories.map((c: any) => (
                <tr key={c.category} className="hover:bg-slate-50 transition">
                  <td className="py-3 px-4 font-bold text-slate-900">{c.category}</td>
                  <td className="py-3 px-4 text-right font-medium text-slate-700">{c.prepared}</td>
                  <td className="py-3 px-4 text-right text-slate-700">{c.consumed}</td>
                  <td className="py-3 px-4 text-right font-bold text-rose-700">{c.waste}</td>
                  <td className="py-3 px-4 text-right font-semibold text-slate-800">{c.waste_pct}%</td>
                  <td className="py-3 px-4 text-right font-bold text-slate-900">${c.cost}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Meal Period Breakdown Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200">
          <h3 className="font-bold text-sm text-slate-900">Performance by Meal Period</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider">
                <th className="py-3 px-4">Meal Period</th>
                <th className="py-3 px-4 text-right">Prepared (kg)</th>
                <th className="py-3 px-4 text-right">Consumed (kg)</th>
                <th className="py-3 px-4 text-right">Discarded (kg)</th>
                <th className="py-3 px-4 text-right">Waste Rate (%)</th>
                <th className="py-3 px-4 text-right">Cost ($)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {mealPeriods.map((m: any) => (
                <tr key={m.meal_period} className="hover:bg-slate-50 transition">
                  <td className="py-3 px-4 font-bold text-slate-900">{m.meal_period}</td>
                  <td className="py-3 px-4 text-right font-medium text-slate-700">{m.prepared}</td>
                  <td className="py-3 px-4 text-right text-slate-700">{m.consumed}</td>
                  <td className="py-3 px-4 text-right font-bold text-rose-700">{m.waste}</td>
                  <td className="py-3 px-4 text-right font-semibold text-slate-800">{m.waste_pct}%</td>
                  <td className="py-3 px-4 text-right font-bold text-slate-900">${m.cost}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
