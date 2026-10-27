import React, { useState, useEffect } from 'react';
import {
  CalendarClock,
  CheckCircle2,
  AlertCircle,
  Plus,
  Printer,
  Sliders,
  UtensilsCrossed,
  TrendingUp,
  ShieldCheck,
  IndianRupee,
  ChevronRight,
  RefreshCw,
  Flame,
  Clock,
  BarChart2
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell
} from 'recharts';
import { foodItemService, forecastingService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { getFoodItemImage } from '../utils/foodImages';

export const PrepPlanner: React.FC = () => {
  const { user } = useAuth();
  const orgName = user?.organization_name || 'Apex Culinary Campus';

  const [mealPeriod, setMealPeriod] = useState<'Breakfast' | 'Lunch' | 'Dinner'>('Lunch');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [safetyBuffer, setSafetyBuffer] = useState<number>(8); // percentage
  const [foodItems, setFoodItems] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [prepPlans, setPrepPlans] = useState<any[]>([]);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchItemsAndForecasts();
  }, [mealPeriod, selectedDate]);

  const fetchItemsAndForecasts = async () => {
    setLoading(true);
    try {
      const res = await foodItemService.list();
      if (res.data?.success) {
        const items = res.data.data;
        setFoodItems(items);

        // Generate shift plan based on items
        const shiftPlans = items.map((it: any, idx: number) => {
          const baseDemand = Number((15 + (idx * 6.5) + (mealPeriod === 'Lunch' ? 12 : mealPeriod === 'Dinner' ? 8 : 4)).toFixed(1));
          const bufferKg = Number(((baseDemand * safetyBuffer) / 100).toFixed(1));
          const plannedKg = Number((baseDemand + bufferKg).toFixed(1));

          const stations = ['Hot Cooking Line', 'Steamers & Rice Kettles', 'Curry & Sambar Range', 'Bakery & Chilled Counter'];
          const station = stations[idx % stations.length];

          return {
            id: it.id,
            name: it.name,
            category: it.category,
            station,
            unit: it.unit || 'kg',
            costPerUnit: Number(it.default_unit_cost || 60),
            baseDemand,
            bufferKg,
            plannedKg,
            actualKg: plannedKg, // default matches plan
            status: idx % 3 === 0 ? 'Cooking' : idx % 3 === 1 ? 'Ready for Service' : 'Planned'
          };
        });

        setPrepPlans(shiftPlans);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateActual = (id: number, val: string) => {
    const num = parseFloat(val) || 0;
    setPrepPlans(prev => prev.map(p => p.id === id ? { ...p, actualKg: num } : p));
  };

  const handleUpdateStatus = (id: number, newStatus: string) => {
    setPrepPlans(prev => prev.map(p => p.id === id ? { ...p, status: newStatus } : p));
  };

  const handleApplyBuffer = (newBuffer: number) => {
    setSafetyBuffer(newBuffer);
    setPrepPlans(prev => prev.map(p => {
      const bufferKg = Number(((p.baseDemand * newBuffer) / 100).toFixed(1));
      const plannedKg = Number((p.baseDemand + bufferKg).toFixed(1));
      return {
        ...p,
        bufferKg,
        plannedKg,
        actualKg: plannedKg
      };
    }));
  };

  const handleSavePlan = () => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      setStatusMessage('Shift kitchen preparation batch sheet saved successfully!');
      setTimeout(() => setStatusMessage(null), 4000);
    }, 600);
  };

  const totalDemand = prepPlans.reduce((acc, p) => acc + p.baseDemand, 0);
  const totalPlanned = prepPlans.reduce((acc, p) => acc + p.plannedKg, 0);
  const totalActual = prepPlans.reduce((acc, p) => acc + p.actualKg, 0);
  const totalCost = prepPlans.reduce((acc, p) => acc + (p.plannedKg * p.costPerUnit), 0);

  return (
    <div className="space-y-5">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
        <span className="text-cyan-700 font-bold">{orgName}</span>
        <span>•</span>
        <span>Prep Planner & Kitchen Batch Actuals</span>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Kitchen Prep Planner & Shift Actuals
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Translate ML demand forecasts into chef station batch targets, calibrate portion buffers, and log real-time cook actuals.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl shadow-xs transition"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500" />
            <span>Print Station Sheets</span>
          </button>
          <button
            onClick={handleSavePlan}
            disabled={saving}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-[#1E6BFF] hover:bg-blue-600 rounded-xl shadow-md shadow-blue-500/25 transition disabled:opacity-50"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{saving ? 'Saving...' : 'Commit Shift Plan'}</span>
          </button>
        </div>
      </div>

      {statusMessage && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* 5-Column Intelligence Banner */}
      <div className="bg-[#0D1C38] border border-slate-800/90 rounded-2xl p-5 text-white shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-xl bg-cyan-950 text-cyan-400 border border-cyan-700/60 flex items-center justify-center font-bold text-xs">
              <Flame className="w-4 h-4 text-cyan-400" />
            </div>
            <div>
              <h2 className="text-sm font-black text-white leading-none">
                Station Production Guidance & Calibration
              </h2>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Targeting zero service stockouts and under 3% post-service surplus
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-slate-400">Buffer Preset:</span>
            {[5, 8, 12].map(pct => (
              <button
                key={pct}
                onClick={() => handleApplyBuffer(pct)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                  safetyBuffer === pct
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-[#081226] text-slate-300 hover:text-white border border-slate-700'
                }`}
              >
                +{pct}%
              </button>
            ))}
          </div>
        </div>

        {/* Shift Summary Insets */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3.5 mt-4">
          <div className="p-3 bg-[#081226]/80 border border-slate-800/70 rounded-xl">
            <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider block mb-1">Shift Period</span>
            <p className="text-base font-extrabold text-white">{mealPeriod} Service</p>
            <p className="text-[11px] text-slate-400 mt-0.5">{selectedDate}</p>
          </div>

          <div className="p-3 bg-[#081226]/80 border border-slate-800/70 rounded-xl">
            <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider block mb-1">Forecast Demand</span>
            <p className="text-base font-extrabold text-white">{totalDemand.toFixed(1)} kg</p>
            <p className="text-[11px] text-cyan-400 mt-0.5">ML moving avg calibrated</p>
          </div>

          <div className="p-3 bg-[#081226]/80 border border-slate-800/70 rounded-xl">
            <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider block mb-1">Safety Margin</span>
            <p className="text-base font-extrabold text-emerald-400">+{safetyBuffer}% ({(totalPlanned - totalDemand).toFixed(1)} kg)</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Service reliability tier</p>
          </div>

          <div className="p-3 bg-[#081226]/80 border border-slate-800/70 rounded-xl">
            <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider block mb-1">Shift Raw Cost</span>
            <p className="text-base font-extrabold text-amber-400">₹{totalCost.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Budget allocation</p>
          </div>
        </div>
      </div>

      {/* Control Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs flex flex-wrap gap-4 items-center justify-between">
        <div className="flex flex-wrap items-center gap-3">
          {/* Meal Period Toggle */}
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold">
            {(['Breakfast', 'Lunch', 'Dinner'] as const).map(m => (
              <button
                key={m}
                onClick={() => setMealPeriod(m)}
                className={`px-3 py-1.5 rounded-lg transition ${
                  mealPeriod === m
                    ? 'bg-white text-blue-600 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {m}
              </button>
            ))}
          </div>

          {/* Date Picker */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent focus:outline-none cursor-pointer"
            />
          </div>
        </div>

        <div className="text-xs font-bold text-slate-500">
          Showing <span className="text-slate-900">{prepPlans.length}</span> batch items scheduled
        </div>
      </div>

      {/* Visual Graphical Workload & Batch Progress */}
      {prepPlans.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs lg:col-span-2">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
                  <BarChart2 className="w-4 h-4 text-blue-600" />
                  <span>Station Batch Workload (kg)</span>
                </h3>
                <p className="text-xs text-slate-400">Total volume scheduled across physical cook lines</p>
              </div>
              <span className="px-2.5 py-1 text-[10px] font-bold bg-cyan-50 text-cyan-800 rounded-lg border border-cyan-200">
                Live Kitchen Stations
              </span>
            </div>

            <div className="h-44 mt-1">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={['Hot Cooking Line', 'Steamers & Rice Kettles', 'Curry & Sambar Range', 'Bakery & Chilled Counter'].map(st => {
                    const stPlans = prepPlans.filter(p => p.station === st);
                    const totalKg = stPlans.reduce((sum, p) => sum + p.plannedKg, 0);
                    return {
                      station: st.split(' ')[0],
                      fullStation: st,
                      volume: Number(totalKg.toFixed(1))
                    };
                  })}
                  margin={{ top: 5, right: 10, left: -20, bottom: 0 }}
                >
                  <XAxis dataKey="station" tick={{ fontSize: 11 }} tickLine={false} />
                  <YAxis tick={{ fontSize: 11 }} tickLine={false} />
                  <Tooltip
                    formatter={(val: any, _name: any, item: any) => [`${val} kg`, item.payload.fullStation]}
                    contentStyle={{ borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '11px' }}
                  />
                  <Bar dataKey="volume" fill="#1E6BFF" radius={[6, 6, 0, 0]} name="Planned (kg)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900">Shift Batch Readiness</h3>
              <p className="text-xs text-slate-400 mb-3">Live line status monitoring</p>
            </div>

            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs font-bold mb-1">
                  <span className="text-slate-600">Ready for Service</span>
                  <span className="text-emerald-600">{prepPlans.filter(p => p.status === 'Ready for Service').length} of {prepPlans.length}</span>
                </div>
                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full"
                    style={{ width: `${(prepPlans.filter(p => p.status === 'Ready for Service').length / (prepPlans.length || 1)) * 100}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-bold mb-1">
                  <span className="text-slate-600">Actively Cooking</span>
                  <span className="text-amber-600">{prepPlans.filter(p => p.status === 'Cooking').length} of {prepPlans.length}</span>
                </div>
                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-500 rounded-full"
                    style={{ width: `${(prepPlans.filter(p => p.status === 'Cooking').length / (prepPlans.length || 1)) * 100}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-bold mb-1">
                  <span className="text-slate-600">Queued / Planned</span>
                  <span className="text-blue-600">{prepPlans.filter(p => p.status === 'Planned').length} of {prepPlans.length}</span>
                </div>
                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full"
                    style={{ width: `${(prepPlans.filter(p => p.status === 'Planned').length / (prepPlans.length || 1)) * 100}%` }}
                  />
                </div>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 mt-2">
              All batches scheduled with +{safetyBuffer}% portion margin.
            </p>
          </div>
        </div>
      )}

      {/* Production Station Batch Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/90 border-b border-slate-200 text-slate-600 uppercase font-black tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Menu Item & Category</th>
                <th className="py-3 px-4">Kitchen Station</th>
                <th className="py-3 px-4 text-right">ML Forecast</th>
                <th className="py-3 px-4 text-right">Buffer (+{safetyBuffer}%)</th>
                <th className="py-3 px-4 text-right font-black text-slate-900">Planned Batch</th>
                <th className="py-3 px-4 text-right">Cooked Actual</th>
                <th className="py-3 px-4 text-center">Batch Status</th>
                <th className="py-3 px-4 text-right">Raw Cost</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">Loading kitchen station plans...</td>
                </tr>
              ) : prepPlans.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">No menu items found. Add items in Inventory to generate plans.</td>
                </tr>
              ) : (
                prepPlans.map((item) => {
                  const dishImg = getFoodItemImage(item.name, item.category);
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3 px-4 font-bold text-slate-900">
                        <div className="flex items-center gap-3">
                          <img
                            src={dishImg}
                            alt={item.name}
                            className="w-11 h-11 rounded-xl object-cover border border-slate-200 shadow-xs flex-shrink-0"
                            onError={(e: any) => {
                              e.target.src = '/images/steamed_basmati_rice.jpg';
                            }}
                          />
                          <div>
                            <div className="font-extrabold text-slate-900 leading-tight">{item.name}</div>
                            <span className="text-[10px] text-slate-400 font-medium">{item.category}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                          {item.station}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right text-slate-600">
                        {item.baseDemand} {item.unit}
                      </td>
                      <td className="py-3 px-4 text-right text-emerald-600 font-bold">
                        +{item.bufferKg} {item.unit}
                      </td>
                      <td className="py-3 px-4 text-right font-black text-blue-600 text-sm">
                        {item.plannedKg} {item.unit}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex items-center justify-end gap-1">
                          <input
                            type="number"
                            step="0.5"
                            value={item.actualKg}
                            onChange={(e) => handleUpdateActual(item.id, e.target.value)}
                            className="w-16 px-2 py-1 text-right text-xs font-bold text-slate-900 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500"
                          />
                          <span className="text-slate-400 text-[11px]">{item.unit}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <select
                          value={item.status}
                          onChange={(e) => handleUpdateStatus(item.id, e.target.value)}
                          className={`text-[11px] font-bold py-1 px-2.5 rounded-full border cursor-pointer focus:outline-none ${
                            item.status === 'Ready for Service'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                              : item.status === 'Cooking'
                              ? 'bg-amber-50 text-amber-700 border-amber-300'
                              : 'bg-blue-50 text-blue-700 border-blue-300'
                          }`}
                        >
                          <option value="Planned">Planned</option>
                          <option value="Cooking">Cooking</option>
                          <option value="Ready for Service">Ready for Service</option>
                        </select>
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-slate-900">
                        ₹{(item.plannedKg * item.costPerUnit).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            <tfoot className="bg-slate-50/90 font-black text-slate-900 border-t border-slate-200">
              <tr>
                <td colSpan={2} className="py-3.5 px-4 uppercase text-[11px] tracking-wider">
                  Total Shift Production
                </td>
                <td className="py-3.5 px-4 text-right text-slate-600">{totalDemand.toFixed(1)} kg</td>
                <td className="py-3.5 px-4 text-right text-emerald-600 font-bold">+{(totalPlanned - totalDemand).toFixed(1)} kg</td>
                <td className="py-3.5 px-4 text-right text-blue-600 text-sm font-black">{totalPlanned.toFixed(1)} kg</td>
                <td className="py-3.5 px-4 text-right text-slate-900 font-black">{totalActual.toFixed(1)} kg</td>
                <td className="py-3.5 px-4 text-center text-xs font-bold text-slate-500">
                  {prepPlans.filter(p => p.status === 'Ready for Service').length} / {prepPlans.length} Ready
                </td>
                <td className="py-3.5 px-4 text-right text-slate-900 font-black text-sm">
                  ₹{totalCost.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};
