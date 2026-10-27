import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, Utensils, AlertCircle, X, CheckCircle2, PieChart as PieChartIcon, BarChart3, Image as ImageIcon } from 'lucide-react';
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
import { foodItemService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { getFoodItemImage } from '../utils/foodImages';

const CATEGORIES = [
  'Cooked Meals',
  'Bakery & Bread',
  'Produce & Salads',
  'Meat & Poultry',
  'Dairy & Desserts',
  'Grains & Staples',
  'Beverages',
  'Other'
];

export const Inventory: React.FC = () => {
  const { user } = useAuth();
  const orgName = user?.organization_name || 'Apex Culinary Campus';

  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [search, setSearch] = useState<string>('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Form Fields
  const [formData, setFormData] = useState({
    name: '',
    category: 'Cooked Meals',
    unit: 'kg',
    default_unit_cost: '60.00',
    shelf_life_days: '2',
    storage_condition: 'Refrigerated',
    is_active: true
  });

  useEffect(() => {
    fetchItems();
  }, [categoryFilter]);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const res = await foodItemService.list({
        category: categoryFilter,
        search
      });
      if (res.data?.success) setItems(res.data.data);
    } catch (err) {
      console.error('Failed to load items');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingId(null);
    setFormError(null);
    setFormData({
      name: '',
      category: 'Cooked Meals',
      unit: 'kg',
      default_unit_cost: '60.00',
      shelf_life_days: '2',
      storage_condition: 'Refrigerated',
      is_active: true
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: any) => {
    setEditingId(item.id);
    setFormError(null);
    setFormData({
      name: item.name,
      category: item.category,
      unit: item.unit,
      default_unit_cost: String(item.default_unit_cost),
      shelf_life_days: String(item.shelf_life_days),
      storage_condition: item.storage_condition,
      is_active: item.is_active
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formData.name.trim()) {
      setFormError('Item name is required.');
      return;
    }

    setSubmitting(true);
    try {
      if (editingId) {
        await foodItemService.update(editingId, {
          name: formData.name.trim(),
          category: formData.category,
          unit: formData.unit,
          default_unit_cost: parseFloat(formData.default_unit_cost) || 0,
          shelf_life_days: parseInt(formData.shelf_life_days) || 1,
          storage_condition: formData.storage_condition,
          is_active: formData.is_active
        });
      } else {
        await foodItemService.create({
          name: formData.name.trim(),
          category: formData.category,
          unit: formData.unit,
          default_unit_cost: parseFloat(formData.default_unit_cost) || 0,
          shelf_life_days: parseInt(formData.shelf_life_days) || 1,
          storage_condition: formData.storage_condition
        });
      }
      setIsModalOpen(false);
      fetchItems();
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Error saving food item.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!window.confirm(`Are you sure you want to delete "${name}" from inventory? Associated historical records will also be removed.`)) return;
    try {
      await foodItemService.delete(id);
      fetchItems();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete food item.');
    }
  };

  const shortShelfLifeCount = items.filter(i => i.shelf_life_days <= 2).length;
  const refrigCount = items.filter(i => i.storage_condition === 'Refrigerated').length;

  return (
    <div className="space-y-5">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
        <span className="text-cyan-700 font-bold">{orgName}</span>
        <span>•</span>
        <span>Inventory & Raw Ingredient Stock</span>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Food Inventory Catalog</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage preparation menu items, categories, storage conditions, and baseline ingredient costs.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold text-white bg-[#1E6BFF] hover:bg-blue-600 rounded-xl shadow-md shadow-blue-500/25 transition"
        >
          <Plus className="w-4 h-4" />
          <span>Add Food Item</span>
        </button>
      </div>

      {/* Intelligence Banner */}
      <div className="bg-[#0D1C38] border border-slate-800/90 rounded-2xl p-5 text-white shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-xl bg-cyan-950 text-cyan-400 border border-cyan-700/60 flex items-center justify-center font-bold text-xs">
              <Utensils className="w-4 h-4 text-cyan-400" />
            </div>
            <div>
              <h2 className="text-sm font-black text-white leading-none">
                Stock Catalog & Cold Storage Status
              </h2>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Active menu tracking and perishable shelf-life distribution
              </p>
            </div>
          </div>
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#070D1F] text-cyan-300 border border-slate-700">
            {items.length} Tracked Catalog Dishes
          </span>
        </div>

        {/* 4 Summary Insets */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3.5 mt-4">
          <div className="p-3 bg-[#081226]/80 border border-slate-800/70 rounded-xl">
            <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider block mb-1">Catalog Items</span>
            <p className="text-xl font-extrabold text-white">{items.length}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Dishes & preparations</p>
          </div>

          <div className="p-3 bg-[#081226]/80 border border-slate-800/70 rounded-xl">
            <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider block mb-1">Refrigerated</span>
            <p className="text-xl font-extrabold text-cyan-400">{refrigCount}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Cold line items</p>
          </div>

          <div className="p-3 bg-[#081226]/80 border border-slate-800/70 rounded-xl">
            <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider block mb-1">Short Shelf-Life</span>
            <p className="text-xl font-extrabold text-amber-400">{shortShelfLifeCount}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">≤ 2 days limit</p>
          </div>

          <div className="p-3 bg-[#081226]/80 border border-slate-800/70 rounded-xl">
            <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider block mb-1">Stock Status</span>
            <p className="text-xl font-extrabold text-emerald-400">Audit OK</p>
            <p className="text-[11px] text-slate-400 mt-0.5">No critical shortages</p>
          </div>
        </div>
      </div>

      {/* Visual Analytics & Breakdown Graphs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Category Breakdown Bar Chart */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
                <BarChart3 className="w-4 h-4 text-blue-600" />
                <span>Inventory Items by Food Category</span>
              </h3>
              <p className="text-xs text-slate-400">Total catalog offerings active across preparation stations</p>
            </div>
            <span className="px-2.5 py-1 text-[10px] font-bold bg-blue-50 text-blue-700 rounded-lg border border-blue-100">
              Station Distribution
            </span>
          </div>

          <div className="h-56 mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={CATEGORIES.map(cat => ({
                  category: cat.split(' ')[0],
                  fullName: cat,
                  count: items.filter(i => i.category === cat).length
                })).filter(c => c.count > 0)}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <XAxis dataKey="category" tick={{ fontSize: 11 }} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} tickLine={false} />
                <Tooltip
                  formatter={(val: any, _name: any, item: any) => [`${val} items`, item.payload.fullName]}
                  contentStyle={{ borderRadius: '10px', border: '1px solid #E2E8F0', fontSize: '12px' }}
                />
                <Bar dataKey="count" fill="#1E6BFF" radius={[6, 6, 0, 0]} name="Dishes Count" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Storage Conditions Donut Chart */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
                <PieChartIcon className="w-4 h-4 text-cyan-600" />
                <span>Cold Holding & Storage</span>
              </h3>
            </div>
            <p className="text-xs text-slate-400 mb-2">HACCP storage requirements distribution</p>
          </div>

          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[
                    { name: 'Refrigerated', value: items.filter(i => i.storage_condition === 'Refrigerated').length || 4, color: '#00B4D8' },
                    { name: 'Ambient', value: items.filter(i => i.storage_condition === 'Ambient' || i.storage_condition === 'Dry').length || 2, color: '#10B981' },
                    { name: 'Hot Holding', value: items.filter(i => i.storage_condition?.includes('Hot')).length || 2, color: '#F59E0B' },
                    { name: 'Frozen', value: items.filter(i => i.storage_condition?.includes('Frozen')).length || 1, color: '#8B5CF6' }
                  ]}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={68}
                  paddingAngle={3}
                >
                  {['#00B4D8', '#10B981', '#F59E0B', '#8B5CF6'].map((color, index) => (
                    <Cell key={`cell-${index}`} fill={color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '11px' }} />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap gap-3 items-center justify-between">
        <div className="flex flex-wrap gap-3 items-center flex-1">
          <div className="relative min-w-[240px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search catalog items..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchItems()}
              className="pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500 w-full"
            />
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="text-xs py-1.5 px-2.5 rounded-lg border border-slate-300 bg-white"
          >
            <option value="">All Categories</option>
            {CATEGORIES.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        <span className="text-xs text-slate-500 font-medium">
          Total items: <strong>{items.length}</strong>
        </span>
      </div>

      {/* Inventory Cards Grid with Food Photography */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {loading && items.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-400">Loading food items...</div>
        ) : items.length === 0 ? (
          <div className="col-span-full bg-white border border-slate-200 rounded-xl p-8 text-center text-slate-500">
            No food items found matching your filters. Click <strong>"Add Food Item"</strong> to create catalog entries.
          </div>
        ) : (
          items.map(item => {
            const foodImg = getFoodItemImage(item.name, item.category);
            return (
              <div key={item.id} className="bg-white rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition overflow-hidden flex flex-col justify-between group">
                <div>
                  {/* Food Image Banner */}
                  <div className="relative h-40 w-full overflow-hidden bg-slate-900">
                    <img
                      src={foodImg}
                      alt={item.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                      onError={(e: any) => {
                        e.target.src = '/images/steamed_basmati_rice.jpg';
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-black/20" />
                    
                    {/* Floating Badges */}
                    <div className="absolute top-2.5 left-2.5">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-black/60 backdrop-blur-md text-white border border-white/20">
                        {item.category}
                      </span>
                    </div>

                    <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-end justify-between">
                      <div>
                        <h4 className="text-sm font-extrabold text-white drop-shadow-md leading-tight">{item.name}</h4>
                        <span className="text-[10px] text-cyan-300 font-semibold drop-shadow-xs">
                          {item.storage_condition}
                        </span>
                      </div>
                      <div className="bg-[#1E6BFF] text-white px-2.5 py-0.5 rounded-lg text-xs font-black shadow-md">
                        ₹{item.default_unit_cost} <span className="text-[10px] font-normal">/{item.unit}</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4">
                    <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      <div>
                        <span className="text-[10px] text-slate-400 block font-semibold uppercase">Unit Cost</span>
                        <strong className="text-slate-900 text-sm">₹{item.default_unit_cost}</strong> / {item.unit}
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block font-semibold uppercase">Shelf Life</span>
                        <strong className={`${item.shelf_life_days <= 1 ? 'text-amber-600' : 'text-slate-900'} text-sm`}>
                          {item.shelf_life_days} day(s)
                        </strong>
                      </div>
                      <div className="col-span-2 pt-1 border-t border-slate-200/60 flex items-center justify-between">
                        <span className="text-[10px] text-slate-400 font-semibold uppercase">Storage Rule</span>
                        <span className="font-bold text-slate-800 text-[11px]">{item.storage_condition}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="px-4 pb-3.5 pt-1 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold ${item.is_active ? 'text-emerald-700' : 'text-slate-400'}`}>
                    <span className={`w-2 h-2 rounded-full ${item.is_active ? 'bg-emerald-500' : 'bg-slate-300'}`}></span>
                    {item.is_active ? 'Active Menu' : 'Inactive'}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(item)}
                      className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition"
                      title="Edit Item"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(item.id, item.name)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition"
                      title="Delete Item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add / Edit Item Modal Dialog */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="font-bold text-base text-slate-900">
                {editingId ? 'Edit Food Item' : 'Add New Food Item'}
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

            <form className="mt-4 space-y-3" onSubmit={handleSubmit}>
              <div>
                <label className="block text-xs font-semibold text-slate-700">Item Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Herb Roasted Potatoes"
                  className="mt-1 block w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700">Category *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="mt-1 block w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white"
                  >
                    {CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700">Measurement Unit</label>
                  <select
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    className="mt-1 block w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white"
                  >
                    <option value="kg">Kilograms (kg)</option>
                    <option value="portions">Portions</option>
                    <option value="liters">Liters</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700">Default Unit Cost (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.default_unit_cost}
                    onChange={(e) => setFormData({ ...formData, default_unit_cost: e.target.value })}
                    className="mt-1 block w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700">Shelf Life (Days)</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.shelf_life_days}
                    onChange={(e) => setFormData({ ...formData, shelf_life_days: e.target.value })}
                    className="mt-1 block w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">Storage Condition</label>
                <select
                  value={formData.storage_condition}
                  onChange={(e) => setFormData({ ...formData, storage_condition: e.target.value })}
                  className="mt-1 block w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white"
                >
                  <option value="Refrigerated">Refrigerated (0°C to 4°C)</option>
                  <option value="Frozen">Frozen (&lt; -18°C)</option>
                  <option value="Ambient">Ambient / Dry Storage</option>
                </select>
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
                  {submitting ? 'Saving...' : editingId ? 'Update Item' : 'Add Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
