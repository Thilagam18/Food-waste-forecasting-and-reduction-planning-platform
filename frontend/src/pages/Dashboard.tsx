import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  TrendingUp,
  TrendingDown,
  Scale,
  UtensilsCrossed,
  Trash2,
  DollarSign,
  AlertTriangle,
  Sparkles,
  ArrowRight,
  Database,
  Calendar,
  Layers,
  CheckCircle2,
  PieChart as PieIcon,
  BarChart2
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';
import { dashboardService, demoService, recommendationService } from '../services/api';

const CATEGORY_COLORS = ['#059669', '#2563eb', '#f59e0b', '#dc2626', '#8b5cf6', '#ec4899', '#06b6d4'];

export const Dashboard: React.FC = () => {
  const [days, setDays] = useState<number>(30);
  const [stats, setStats] = useState<any>(null);
  const [charts, setCharts] = useState<any>(null);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [demoLoading, setDemoLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData(days);
  }, [days]);

  const fetchDashboardData = async (selectedDays: number) => {
    setLoading(true);
    setError(null);
    try {
      const [statsRes, chartsRes, recsRes] = await Promise.all([
        dashboardService.getStats(selectedDays),
        dashboardService.getCharts(selectedDays),
        recommendationService.list({ status: 'Pending' })
      ]);

      if (statsRes.data?.success) setStats(statsRes.data.data);
      if (chartsRes.data?.success) setCharts(chartsRes.data.data);
      if (recsRes.data?.success) setRecommendations(recsRes.data.data.slice(0, 3));
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load dashboard metrics.');
    } finally {
      setLoading(false);
    }
  };

  const handleLoadDemo = async () => {
    try {
      setDemoLoading(true);
      await demoService.load();
      await fetchDashboardData(days);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to load demonstration data.');
    } finally {
      setDemoLoading(false);
    }
  };

  const metrics = stats?.metrics;
  const hasData = stats?.has_data;

  return (
    <div className="space-y-6">
      {/* Top Banner & Date Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Operations & Reduction Dashboard</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Real-time kitchen food preparation, surplus analysis, and waste KPIs
          </p>
        </div>

        {/* Date Filter & Demo Indicator */}
        <div className="flex items-center gap-2">
          {stats?.has_demo_data && (
            <span className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold bg-amber-100 text-amber-900 border border-amber-300 rounded-lg">
              <Database className="w-3.5 h-3.5" />
              <span>Demo Data Active</span>
            </span>
          )}

          <div className="flex bg-white border border-slate-200 rounded-lg p-0.5 shadow-sm text-xs font-medium">
            {[7, 14, 30, 90].map((d) => (
              <button
                key={d}
                onClick={() => setDays(d)}
                className={`px-3 py-1.5 rounded-md transition ${
                  days === d
                    ? 'bg-emerald-700 text-white font-semibold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                {d === 7 ? '7D' : d === 14 ? '14D' : d === 30 ? '30D' : '90D'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Loading Skeleton */}
      {loading && !stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-pulse">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-28 bg-white border border-slate-200 rounded-xl p-4"></div>
          ))}
        </div>
      )}

      {/* Empty State Banner if no records exist */}
      {!loading && !hasData && (
        <div className="bg-white border-2 border-dashed border-emerald-300 rounded-2xl p-8 text-center max-w-2xl mx-auto shadow-sm">
          <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto mb-3">
            <UtensilsCrossed className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">No Food Records Logged Yet</h3>
          <p className="mt-1 text-sm text-slate-600 max-w-md mx-auto">
            Your database is ready for live operational records. You can start logging daily kitchen preparation, or load clearly labelled demonstration data to explore all features right away.
          </p>
          <div className="mt-5 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to="/logs"
              className="w-full sm:w-auto px-4 py-2 text-sm font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-sm transition"
            >
              Add First Food Record
            </Link>
            <button
              onClick={handleLoadDemo}
              disabled={demoLoading}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-lg transition disabled:opacity-50"
            >
              <Database className="w-4 h-4" />
              <span>{demoLoading ? 'Generating Sample Records...' : 'Load 30-Day Demo Dataset'}</span>
            </button>
          </div>
        </div>
      )}

      {/* 8 Primary KPI Metric Cards */}
      {metrics && (
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Total Food Prepared */}
          <div className="card-glass p-4 rounded-xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Prepared</span>
              <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
                <UtensilsCrossed className="w-4 h-4" />
              </div>
            </div>
            <p className="mt-2 text-2xl font-extrabold text-slate-900">{metrics.total_prepared_kg.toLocaleString()} <span className="text-xs font-normal text-slate-500">kg</span></p>
            <p className="text-[11px] text-slate-500 mt-1">Across all recorded meal shifts</p>
          </div>

          {/* Card 2: Total Food Consumed */}
          <div className="card-glass p-4 rounded-xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Consumed</span>
              <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
                <Scale className="w-4 h-4" />
              </div>
            </div>
            <p className="mt-2 text-2xl font-extrabold text-slate-900">{metrics.total_consumed_kg.toLocaleString()} <span className="text-xs font-normal text-slate-500">kg</span></p>
            <p className="text-[11px] text-slate-500 mt-1">Eaten by patrons / students</p>
          </div>

          {/* Card 3: Total Food Waste */}
          <div className="card-glass p-4 rounded-xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Discarded Waste</span>
              <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-700 flex items-center justify-center">
                <Trash2 className="w-4 h-4" />
              </div>
            </div>
            <p className="mt-2 text-2xl font-extrabold text-rose-700">{metrics.total_waste_kg.toLocaleString()} <span className="text-xs font-normal text-slate-500">kg</span></p>
            <p className="text-[11px] text-slate-500 mt-1">Overproduction, spoilage & plate</p>
          </div>

          {/* Card 4: Current Surplus */}
          <div className="card-glass p-4 rounded-xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Current Surplus</span>
              <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
                <Layers className="w-4 h-4" />
              </div>
            </div>
            <p className="mt-2 text-2xl font-extrabold text-amber-700">{metrics.current_surplus_kg.toLocaleString()} <span className="text-xs font-normal text-slate-500">kg</span></p>
            <p className="text-[11px] text-slate-500 mt-1">Excess prep available for rescue</p>
          </div>

          {/* Card 5: Waste Percentage */}
          <div className="card-glass p-4 rounded-xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Waste Percentage</span>
              <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center">
                %
              </div>
            </div>
            <p className="mt-2 text-2xl font-extrabold text-slate-900">{metrics.waste_percentage}%</p>
            <p className="text-[11px] text-slate-500 mt-1">Target baseline: &lt; 8.0%</p>
          </div>

          {/* Card 6: Estimated Cost of Waste */}
          <div className="card-glass p-4 rounded-xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Estimated Waste Cost</span>
              <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-700 flex items-center justify-center">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <p className="mt-2 text-2xl font-extrabold text-rose-700">${metrics.total_waste_cost.toLocaleString()}</p>
            <p className="text-[11px] text-slate-500 mt-1">Financial loss from discards</p>
          </div>

          {/* Card 7: Waste Reduction vs Prev Period */}
          <div className="card-glass p-4 rounded-xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Waste Reduction Rate</span>
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                metrics.reduction_vs_previous_period >= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
              }`}>
                {metrics.reduction_vs_previous_period >= 0 ? <TrendingDown className="w-4 h-4" /> : <TrendingUp className="w-4 h-4" />}
              </div>
            </div>
            <p className={`mt-2 text-2xl font-extrabold ${metrics.reduction_vs_previous_period >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
              {metrics.reduction_vs_previous_period > 0 ? `+${metrics.reduction_vs_previous_period}%` : `${metrics.reduction_vs_previous_period}%`}
            </p>
            <p className="text-[11px] text-slate-500 mt-1">Compared with prior {days} days</p>
          </div>

          {/* Card 8: Forecasted Demand */}
          <div className="card-glass p-4 rounded-xl bg-gradient-to-br from-emerald-950 to-emerald-900 text-white">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-300 uppercase tracking-wider">Forecasted Demand</span>
              <div className="w-7 h-7 rounded-lg bg-emerald-800/80 text-emerald-300 flex items-center justify-center">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <p className="mt-2 text-2xl font-extrabold text-white">{metrics.forecasted_demand_kg.toLocaleString()} <span className="text-xs font-normal text-emerald-300">kg</span></p>
            <p className="text-[11px] text-emerald-300 mt-1">Predicted demand for next 7 days</p>
          </div>
        </div>
      )}

      {/* Main Charts Row 1: Daily Waste Trends & Prepared vs Consumed */}
      {charts && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Chart 1: Daily Waste & Surplus Trends */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">Daily Food Waste & Surplus Trends</h3>
                <p className="text-xs text-slate-500">Recorded discards (kg) and surplus over time</p>
              </div>
            </div>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={charts.daily_trends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorWaste" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#dc2626" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#dc2626" stopOpacity={0.0}/>
                    </linearGradient>
                    <linearGradient id="colorSurplus" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} />
                  <YAxis tick={{ fontSize: 11 }} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }} />
                  <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                  <Area type="monotone" dataKey="waste" stroke="#dc2626" fillOpacity={1} fill="url(#colorWaste)" name="Discarded Waste (kg)" strokeWidth={2} />
                  <Area type="monotone" dataKey="surplus" stroke="#f59e0b" fillOpacity={1} fill="url(#colorSurplus)" name="Surplus Food (kg)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 2: Prepared vs Consumed */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">Prepared vs. Consumed Volume</h3>
                <p className="text-xs text-slate-500">Service output versus actual diner consumption (kg)</p>
              </div>
            </div>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={charts.daily_trends.slice(-14)} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} />
                  <YAxis tick={{ fontSize: 11 }} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }} />
                  <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                  <Bar dataKey="prepared" fill="#10b981" name="Prepared (kg)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="consumed" fill="#3b82f6" name="Consumed (kg)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Main Charts Row 2: Category Breakdown & Top Wasted Items */}
      {charts && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chart 3: Waste by Category */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs lg:col-span-1">
            <h3 className="text-base font-bold text-slate-900">Waste by Food Category</h3>
            <p className="text-xs text-slate-500 mb-4">Distribution across inventory classes</p>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={charts.category_breakdown}
                    dataKey="waste_kg"
                    nameKey="category"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    innerRadius={45}
                    paddingAngle={3}
                  >
                    {charts.category_breakdown.map((_: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }} />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 4: Top Wasted Food Items */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs lg:col-span-2">
            <h3 className="text-base font-bold text-slate-900">Top Wasted Food Items (High Priority)</h3>
            <p className="text-xs text-slate-500 mb-4">Items with highest cumulative discard weight (kg) & financial loss</p>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={charts.top_wasted_items} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                  <XAxis type="number" tick={{ fontSize: 11 }} tickLine={false} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} tickLine={false} width={130} />
                  <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }} />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Bar dataKey="waste_kg" fill="#e11d48" name="Discarded (kg)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Row 3: Actionable Intelligence & Active Recommendations Widget */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recommended Actions */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-emerald-600" />
              <h3 className="text-base font-bold text-slate-900">Active High-Impact Recommendations</h3>
            </div>
            <Link to="/recommendations" className="text-xs font-semibold text-emerald-700 hover:text-emerald-900 flex items-center gap-1">
              View All <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {recommendations.length === 0 ? (
            <p className="text-xs text-slate-500 py-6 text-center">
              No pending recommendations. System analysis will populate action cards once consecutive service logs are recorded.
            </p>
          ) : (
            <div className="space-y-3">
              {recommendations.map((rec) => (
                <div key={rec.id} className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/60 hover:bg-slate-50 transition">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs font-bold text-slate-900">{rec.title}</span>
                    <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                      rec.priority === 'High' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {rec.priority} Priority
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1 line-clamp-2">{rec.recommendation_text}</p>
                  <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
                    <span className="font-semibold text-emerald-700">Est. Savings: ${rec.potential_savings_cost}</span>
                    <span>Potential: {rec.potential_waste_reduction_kg} kg waste cut</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Environmental & Carbon Impact Teaser */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-lg">🌍</span>
                <h3 className="text-base font-bold text-slate-900">Verified Environmental Avoidance</h3>
              </div>
              <Link to="/impact" className="text-xs font-semibold text-emerald-700 hover:text-emerald-900 flex items-center gap-1">
                Full Methodology <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <p className="text-xs text-slate-600">
              Scientific conversions verified through recorded intervention outcomes (US EPA WARM & FAO benchmarks):
            </p>

            <div className="grid grid-cols-3 gap-3 mt-4 text-center">
              <div className="p-3 bg-emerald-50/70 border border-emerald-200/60 rounded-xl">
                <p className="text-xl font-extrabold text-emerald-800">{metrics?.co2_avoided_kg || 0}</p>
                <p className="text-[11px] font-semibold text-emerald-700 mt-0.5">kg CO2e Avoided</p>
              </div>
              <div className="p-3 bg-blue-50/70 border border-blue-200/60 rounded-xl">
                <p className="text-xl font-extrabold text-blue-800">{(metrics?.water_saved_liters || 0).toLocaleString()}</p>
                <p className="text-[11px] font-semibold text-blue-700 mt-0.5">Liters Water Saved</p>
              </div>
              <div className="p-3 bg-amber-50/70 border border-amber-200/60 rounded-xl">
                <p className="text-xl font-extrabold text-amber-800">{metrics?.meals_equivalent_saved || 0}</p>
                <p className="text-[11px] font-semibold text-amber-700 mt-0.5">Meals Rescued</p>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Intervention Food Saved: <strong className="text-slate-800">{metrics?.food_saved_interventions_kg || 0} kg</strong></span>
            <span>Financial Recovered: <strong className="text-emerald-700">${metrics?.cost_saved_interventions || 0}</strong></span>
          </div>
        </div>
      </div>
    </div>
  );
};
