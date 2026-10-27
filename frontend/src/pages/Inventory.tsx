import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, Utensils, AlertCircle, X, CheckCircle2 } from 'lucide-react';
import { foodItemService } from '../services/api';

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
    default_unit_cost: '0.00',
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
      default_unit_cost: '5.00',
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

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Food Inventory Catalog</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Manage preparation menu items, categories, storage conditions, and unit costs
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-sm transition"
        >
          <Plus className="w-4 h-4" />
          <span>Add Food Item</span>
        </button>
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
              className="pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500 w-full"
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

      {/* Inventory Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading && items.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-400">Loading food items...</div>
        ) : items.length === 0 ? (
          <div className="col-span-full bg-white border border-slate-200 rounded-xl p-8 text-center text-slate-500">
            No food items found matching your filters. Click <strong>"Add Food Item"</strong> to create catalog entries.
          </div>
        ) : (
          items.map(item => (
            <div key={item.id} className="card-glass p-4 rounded-xl flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between gap-2">
                  <span className="font-bold text-sm text-slate-900 leading-tight">{item.name}</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                    {item.category}
                  </span>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Unit Cost</span>
                    <strong className="text-slate-900">${item.default_unit_cost}</strong> / {item.unit}
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Shelf Life</span>
                    <strong className="text-slate-900">{item.shelf_life_days} day(s)</strong>
                  </div>
                  <div className="col-span-2 pt-1 border-t border-slate-200/60 flex items-center justify-between">
                    <span className="text-[10px] text-slate-400">Storage</span>
                    <span className="font-semibold text-slate-800">{item.storage_condition}</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className={`inline-flex items-center gap-1 text-[11px] font-medium ${item.is_active ? 'text-emerald-700' : 'text-slate-400'}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${item.is_active ? 'bg-emerald-500' : 'bg-slate-300'}`}></span>
                  {item.is_active ? 'Active' : 'Inactive'}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenEdit(item)}
                    className="p-1 text-slate-400 hover:text-emerald-700 rounded transition"
                    title="Edit Item"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(item.id, item.name)}
                    className="p-1 text-slate-400 hover:text-rose-700 rounded transition"
                    title="Delete Item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
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
                  <label className="block text-xs font-semibold text-slate-700">Default Unit Cost ($)</label>
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
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-sm transition disabled:opacity-50"
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
