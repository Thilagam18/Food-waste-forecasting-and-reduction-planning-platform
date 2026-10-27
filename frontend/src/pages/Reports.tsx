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
import { useAuth } from '../context/AuthContext';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';

export const Reports: React.FC = () => {
  const { user } = useAuth();
  const orgName = user?.organization_name || 'Apex Culinary Campus';

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

  return (
    <div className="space-y-5">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
        <span className="text-cyan-700 font-bold">{orgName}</span>
        <span>•</span>
        <span>Audit Reports & Executive Data Export</span>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Audit Reports & Data Export</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Operational food prep audits, category discards, cost breakdowns, and CSV reporting exports.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl shadow-xs transition"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500" />
            <span>Print View</span>
          </button>
          <button
            onClick={handleDownloadCSV}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-[#1E6BFF] hover:bg-blue-600 rounded-xl shadow-md shadow-blue-500/25 transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download CSV Audit Log</span>
          </button>
        </div>
      </div>

      {/* Intelligence Banner */}
      <div className="bg-[#0D1C38] border border-slate-800/90 rounded-2xl p-5 text-white shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-xl bg-cyan-950 text-cyan-400 border border-cyan-700/60 flex items-center justify-center font-bold text-xs">
              <FileText className="w-4 h-4 text-cyan-400" />
            </div>
            <div>
              <h2 className="text-sm font-black text-white leading-none">
                Compliance & Financial Audit Verification
              </h2>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Audit period: {startDate} to {endDate}
              </p>
            </div>
          </div>
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#070D1F] text-cyan-300 border border-slate-700">
            {totals?.records_count || 0} Operational Logs Audited
          </span>
        </div>

        {/* 4 Summary Insets */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3.5 mt-4">
          <div className="p-3 bg-[#081226]/80 border border-slate-800/70 rounded-xl">
            <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider block mb-1">Total Prepared</span>
            <p className="text-xl font-extrabold text-white">{(totals?.total_prepared_kg || 0).toLocaleString()} kg</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Audit volume</p>
          </div>

          <div className="p-3 bg-[#081226]/80 border border-slate-800/70 rounded-xl">
            <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider block mb-1">Total Waste</span>
            <p className="text-xl font-extrabold text-rose-400">{(totals?.total_waste_kg || 0).toLocaleString()} kg</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Waste rate: {totals?.waste_percentage || 0}%</p>
          </div>

          <div className="p-3 bg-[#081226]/80 border border-slate-800/70 rounded-xl">
            <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider block mb-1">Monetary Waste Cost</span>
            <p className="text-xl font-extrabold text-amber-400">₹{(totals?.total_cost || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Discard procurement loss</p>
          </div>

          <div className="p-3 bg-[#081226]/80 border border-slate-800/70 rounded-xl">
            <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider block mb-1">Consumption Rate</span>
            <p className="text-xl font-extrabold text-emerald-400">{totals?.total_prepared_kg ? `${Math.round(((totals.total_prepared_kg - totals.total_waste_kg) / totals.total_prepared_kg) * 100)}%` : '93%'}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Food service efficiency</p>
          </div>
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
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Waste Loss (₹)</span>
            <p className="mt-1 text-2xl font-extrabold text-rose-700">₹{totals.total_cost}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Procurement value discarded</p>
          </div>
          <div className="card-glass p-4 rounded-xl">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Waste Percentage</span>
            <p className="mt-1 text-2xl font-extrabold text-slate-900">{totals.waste_percentage}%</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Of prepared mass</p>
          </div>
        </div>
      )}

      {/* Visual Graphical Analytics */}
      {categories.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Category Discard vs Consumed Bar Chart */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs lg:col-span-2">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">Food Discards by Category (kg)</h3>
                <p className="text-xs text-slate-400">Preparation waste vs consumed mass across catalog categories</p>
              </div>
              <span className="px-2.5 py-1 text-[10px] font-bold bg-rose-50 text-rose-700 rounded-lg border border-rose-200">
                Loss Breakdown
              </span>
            </div>

            <div className="h-56 mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categories} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="category" tick={{ fontSize: 11 }} tickLine={false} />
                  <YAxis tick={{ fontSize: 11 }} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: '10px', border: '1px solid #E2E8F0', fontSize: '11px' }} />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                  <Bar dataKey="consumed" fill="#00B4D8" radius={[4, 4, 0, 0]} name="Consumed (kg)" />
                  <Bar dataKey="waste" fill="#E11D48" radius={[4, 4, 0, 0]} name="Waste Discard (kg)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Meal Period Waste Contribution Donut */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900">Waste by Meal Period</h3>
              <p className="text-xs text-slate-400 mb-2">Shift proportion of total discard kg</p>
            </div>

            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={mealPeriods.map((m: any, idx: number) => ({
                      name: m.meal_period,
                      value: m.waste,
                      color: ['#1E6BFF', '#00B4D8', '#F59E0B', '#10B981', '#8B5CF6'][idx % 5]
                    }))}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={68}
                    paddingAngle={3}
                  >
                    {mealPeriods.map((_: any, idx: number) => (
                      <Cell key={idx} fill={['#1E6BFF', '#00B4D8', '#F59E0B', '#10B981', '#8B5CF6'][idx % 5]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '11px' }} />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
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
                <th className="py-3 px-4 text-right">Cost (₹)</th>
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
                  <td className="py-3 px-4 text-right font-bold text-slate-900">₹{c.cost}</td>
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
                <th className="py-3 px-4 text-right">Cost (₹)</th>
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
                  <td className="py-3 px-4 text-right font-bold text-slate-900">₹{m.cost}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
