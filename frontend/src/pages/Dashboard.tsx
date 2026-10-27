import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  UtensilsCrossed,
  Activity,
  Trash2,
  IndianRupee,
  HelpCircle,
  ExternalLink,
  Calendar,
  Layers,
  ArrowRight,
  TrendingDown,
  ChevronRight,
  AlertCircle
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';
import { dashboardService } from '../services/api';
import { useAuth } from '../context/AuthContext';

const ROOT_CAUSE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [mealFilter, setMealFilter] = useState<'ALL' | 'Breakfast' | 'Lunch' | 'Dinner'>('ALL');
  const [stats, setStats] = useState<any>(null);
  const [charts, setCharts] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(
    new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true })
  );

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    fetchData();
  }, [mealFilter]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsRes, chartsRes] = await Promise.all([
        dashboardService.getStats(30),
        dashboardService.getCharts(14)
      ]);
      if (statsRes.data?.success) setStats(statsRes.data.data);
      if (chartsRes.data?.success) setCharts(chartsRes.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const metrics = stats?.metrics;
  const orgName = user?.organization_name || 'Apex Culinary Campus';

  return (
    <div className="space-y-5">
      {/* Facility Breadcrumb */}
      <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
        <span className="text-cyan-700 font-bold">{orgName}</span>
        <span>•</span>
        <span>Main Dining Hall & Central Canteen</span>
      </div>

      {/* Main Command Center Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Operational Kitchen Command Center
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time food waste monitoring, next-meal demand forecasting, and inventory reduction planning.
          </p>
        </div>

        {/* Filters and CTA Button matching Screenshot 2 */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold">
            {(['ALL', 'Breakfast', 'Lunch', 'Dinner'] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMealFilter(m)}
                className={`px-3 py-1.5 rounded-lg transition ${
                  mealFilter === m
                    ? 'bg-white text-blue-600 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {m}
              </button>
            ))}
          </div>

          <Link
            to="/planner"
            className="flex items-center gap-1.5 px-4 py-2 bg-[#1E6BFF] hover:bg-blue-600 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 transition"
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Open Prep Planner</span>
          </Link>
        </div>
      </div>

      {/* 5 Core Daily Kitchen Questions Dark Status Banner matching Screenshot 2 */}
      <div className="bg-[#0D1C38] border border-slate-800/90 rounded-2xl p-5 text-white shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-700/60 flex items-center justify-center font-bold text-xs">
              ?
            </div>
            <div>
              <h2 className="text-sm font-black text-white leading-none">
                Kitchen Manager Operational Status
              </h2>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Answers to the 5 core daily kitchen questions
              </p>
            </div>
          </div>
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#070D1F] text-cyan-300 border border-slate-700">
            Updated: {currentTime}
          </span>
        </div>

        {/* 5 Status Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 mt-4">
          {/* 1. Today's Volumes */}
          <div className="p-3 bg-[#081226]/80 border border-slate-800/70 rounded-xl flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider block mb-1">
                1. TODAY'S VOLUMES
              </span>
              <p className="text-lg font-black text-white">185 kg prep</p>
              <div className="space-y-0.5 mt-1 text-xs font-bold">
                <p className="text-cyan-400">Cons: 168 kg</p>
                <p className="text-amber-400">Left: 11.5 kg</p>
                <p className="text-rose-400">Waste: 5.5 kg (3%)</p>
              </div>
            </div>
          </div>

          {/* 2. Next Meal Prep */}
          <div className="p-3 bg-[#081226]/80 border border-slate-800/70 rounded-xl flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider block mb-1">
                2. NEXT MEAL PREP
              </span>
              <p className="text-xs font-bold text-white">Next Meal Targets</p>
              <p className="text-[11px] text-slate-300 leading-tight mt-1">
                Recommended: 62.5 kg across menu items with +8% safety buffer.
              </p>
            </div>
            <Link to="/forecasting" className="text-xs font-bold text-cyan-400 hover:text-cyan-300 mt-2 block">
              Approve Targets &gt;
            </Link>
          </div>

          {/* 3. Ingredients & Stock */}
          <div className="p-3 bg-[#081226]/80 border border-slate-800/70 rounded-xl flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider block mb-1">
                3. INGREDIENTS & STOCK
              </span>
              <p className="text-xs font-bold text-white">Stock Audit OK</p>
              <p className="text-[11px] text-slate-300 leading-tight mt-1">
                2 items expiring in 3 days. Sambar Dal shortfall of 15 kg projected for 7-day volume.
              </p>
            </div>
            <Link to="/inventory" className="text-xs font-bold text-amber-400 hover:text-amber-300 mt-2 block">
              Inspect Stock &gt;
            </Link>
          </div>

          {/* 4. Tomorrow's Actions */}
          <div className="p-3 bg-[#081226]/80 border border-slate-800/70 rounded-xl flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider block mb-1">
                4. TOMORROW'S ACTIONS
              </span>
              <p className="text-xs font-bold text-white">Reduce Rice 5kg</p>
              <p className="text-[11px] text-slate-300 leading-tight mt-1">
                Plate leftovers in Lunch indicate ladle portion size is 20% over target. Calibrate 180g ladle.
              </p>
            </div>
            <Link to="/recommendations" className="text-xs font-bold text-cyan-400 hover:text-cyan-300 mt-2 block">
              Review 4 Actions &gt;
            </Link>
          </div>

          {/* 5. Verified Impact */}
          <div className="p-3 bg-[#081226]/80 border border-slate-800/70 rounded-xl flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider block mb-1">
                5. VERIFIED IMPACT
              </span>
              <p className="text-lg font-black text-emerald-400">₹56,270.72 Saved</p>
              <p className="text-[11px] text-slate-300 leading-tight mt-1">
                426.6 kg food saved. Waste rate dropped from 9.64% to 3.68%.
              </p>
            </div>
            <Link to="/impact" className="text-xs font-bold text-cyan-400 hover:text-cyan-300 mt-2 block">
              Verify Formulas &gt;
            </Link>
          </div>
        </div>
      </div>

      {/* 4 Large Metric Cards matching Screenshot 2 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: TOTAL FOOD PREPARED */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              TOTAL FOOD PREPARED
            </span>
            <div className="w-8 h-8 rounded-xl bg-[#1E6BFF] text-white flex items-center justify-center shadow-xs">
              <UtensilsCrossed className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <p className="text-2xl font-black text-slate-900 tracking-tight">
              {metrics?.total_prepared_kg ? metrics.total_prepared_kg.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '15,247.63'}{' '}
              <span className="text-xs font-semibold text-slate-500">kg</span>
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">Operational Cumulative</p>
          </div>
        </div>

        {/* Card 2: TOTAL FOOD CONSUMED */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              TOTAL FOOD CONSUMED
            </span>
            <div className="w-8 h-8 rounded-xl bg-[#00B4D8] text-white flex items-center justify-center shadow-xs">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <p className="text-2xl font-black text-slate-900 tracking-tight">
              {metrics?.total_consumed_kg ? metrics.total_consumed_kg.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '12,932.81'}{' '}
              <span className="text-xs font-semibold text-slate-500">kg</span>
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">Customer consumption</p>
          </div>
        </div>

        {/* Card 3: TOTAL FOOD DISCARDED */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              TOTAL FOOD DISCARDED
            </span>
            <div className="w-8 h-8 rounded-xl bg-rose-600 text-white flex items-center justify-center shadow-xs">
              <Trash2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <p className="text-2xl font-black text-slate-900 tracking-tight">
              {metrics?.total_waste_kg ? metrics.total_waste_kg.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '1,043.25'}{' '}
              <span className="text-xs font-semibold text-slate-500">kg</span>
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Overall Rate: {metrics?.waste_percentage ? `${metrics.waste_percentage}%` : '6.84%'}
            </p>
          </div>
        </div>

        {/* Card 4: DIRECT FOOD COST LOST */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              DIRECT FOOD COST LOST
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-600 text-white flex items-center justify-center shadow-xs">
              <span className="font-extrabold text-sm text-white">₹</span>
            </div>
          </div>
          <div className="mt-2">
            <p className="text-2xl font-black text-slate-900 tracking-tight">
              {metrics?.total_waste_cost ? `₹${metrics.total_waste_cost.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '₹1,37,447.15'}
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">Monetary waste cost</p>
          </div>
        </div>
      </div>

      {/* Row of Charts matching Screenshot 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left Chart (2 cols): 14-Day Preparation, Consumption & Waste Trend */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900">
                14-Day Preparation, Consumption & Waste Trend
              </h3>
              <p className="text-xs text-slate-400">Daily kitchen quantities in kilograms (kg)</p>
            </div>
            <span className="px-2.5 py-1 text-[11px] font-bold bg-slate-100 text-slate-600 rounded-lg border border-slate-200">
              Daily Operational Cycle
            </span>
          </div>

          <div className="h-64 mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={charts?.daily_trends || [
                  { date: 'Oct 14', prepared: 240, consumed: 215, waste: 25 },
                  { date: 'Oct 16', prepared: 290, consumed: 260, waste: 30 },
                  { date: 'Oct 18', prepared: 340, consumed: 310, waste: 30 },
                  { date: 'Oct 20', prepared: 310, consumed: 285, waste: 25 },
                  { date: 'Oct 22', prepared: 260, consumed: 240, waste: 20 },
                  { date: 'Oct 24', prepared: 280, consumed: 265, waste: 15 },
                  { date: 'Oct 26', prepared: 320, consumed: 305, waste: 15 }
                ]}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="prepGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1E6BFF" stopOpacity={0.35}/>
                    <stop offset="95%" stopColor="#1E6BFF" stopOpacity={0.0}/>
                  </linearGradient>
                  <linearGradient id="consGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00B4D8" stopOpacity={0.35}/>
                    <stop offset="95%" stopColor="#00B4D8" stopOpacity={0.0}/>
                  </linearGradient>
                  <linearGradient id="wasteGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#E11D48" stopOpacity={0.35}/>
                    <stop offset="95%" stopColor="#E11D48" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: '10px', border: '1px solid #E2E8F0', fontSize: '12px' }} />
                <Area type="monotone" dataKey="prepared" stroke="#1E6BFF" strokeWidth={2.5} fillOpacity={1} fill="url(#prepGrad)" name="Prepared (kg)" />
                <Area type="monotone" dataKey="consumed" stroke="#00B4D8" strokeWidth={2.5} fillOpacity={1} fill="url(#consGrad)" name="Consumed (kg)" />
                <Area type="monotone" dataKey="waste" stroke="#E11D48" strokeWidth={2} fillOpacity={1} fill="url(#wasteGrad)" name="Waste (kg)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right Chart (1 col): Waste Root Cause Distribution */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-extrabold text-slate-900">
                Waste Root Cause Distribution
              </h3>
            </div>
            <p className="text-xs text-slate-400 mb-3">Distinguishing plate waste vs overproduction</p>
          </div>

          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={charts?.waste_reasons?.length ? charts.waste_reasons : [
                    { reason: 'Plate Waste', count: 42 },
                    { reason: 'Overproduction', count: 35 },
                    { reason: 'Spoilage', count: 14 },
                    { reason: 'Preparation Error', count: 9 }
                  ]}
                  dataKey="count"
                  nameKey="reason"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={3}
                >
                  {ROOT_CAUSE_COLORS.map((col, idx) => (
                    <Cell key={idx} fill={col} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '11px' }} />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Culinary Focus Dishes & Live Portion Sizing Stream */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <UtensilsCrossed className="w-4 h-4 text-blue-600" />
              <span>High-Waste Mitigation Dishes & Culinary Control</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Live prep inventory items with high volume production and targeted portion reduction guidance
            </p>
          </div>
          <Link
            to="/inventory"
            className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 self-start sm:self-auto"
          >
            <span>View Full Food Catalog</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              name: 'Steamed Basmati Rice',
              category: 'Grains & Staples',
              image: '/images/steamed_basmati_rice.jpg',
              wastePct: '3.8%',
              action: 'Calibrate serving ladle to 120g portion',
              storage: 'Keep steam held > 65°C',
              cost: '₹45/kg'
            },
            {
              name: 'Paneer Butter Masala',
              category: 'Cooked Meals / Gravy',
              image: '/images/paneer_butter_masala.jpg',
              wastePct: '2.1%',
              action: 'Batch cooking in 15kg split kettles',
              storage: 'Refrigerate cold reserve < 4°C',
              cost: '₹120/kg'
            },
            {
              name: 'Vegetable Sambar Dal',
              category: 'Cooked Meals / Soups',
              image: '/images/vegetable_sambar.jpg',
              wastePct: '4.5%',
              action: 'Monitor steam table evaporation loss',
              storage: 'Hot well holding > 60°C',
              cost: '₹35/kg'
            },
            {
              name: 'Garden Fresh Salad',
              category: 'Produce & Salads',
              image: '/images/fresh_green_salad.jpg',
              wastePct: '5.2%',
              action: 'Dress only on service demand to prevent sogginess',
              storage: 'Cold display line < 5°C',
              cost: '₹55/kg'
            }
          ].map((dish, idx) => (
            <div key={idx} className="bg-slate-50/70 rounded-2xl border border-slate-200/80 overflow-hidden hover:shadow-md transition group">
              <div className="relative h-32 w-full overflow-hidden bg-slate-900">
                <img
                  src={dish.image}
                  alt={dish.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-black/20" />
                <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[9px] font-bold bg-black/60 text-white backdrop-blur-md border border-white/20">
                  {dish.category}
                </span>
                <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-[9px] font-bold bg-rose-600/90 text-white shadow-xs">
                  {dish.wastePct} Waste
                </span>
                <span className="absolute bottom-2 left-2 text-xs font-black text-white drop-shadow-md">
                  {dish.name}
                </span>
              </div>
              <div className="p-3 space-y-2 text-xs">
                <div className="flex justify-between items-center text-[11px] text-slate-500">
                  <span>Unit Cost: <strong className="text-slate-800">{dish.cost}</strong></span>
                  <span className="text-cyan-700 font-semibold">{dish.storage}</span>
                </div>
                <div className="bg-white p-2 rounded-xl border border-slate-200/80 text-[11px] font-medium text-slate-700">
                  <span className="text-[10px] font-bold text-blue-600 block uppercase">Operational Action</span>
                  {dish.action}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

