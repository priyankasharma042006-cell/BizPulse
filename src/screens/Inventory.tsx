import { useState, type FormEvent } from 'react';
import { Package, Plus, AlertTriangle, X } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { suggestReorder } from '@/lib/analytics';
import { useBusinessData } from '@/hooks/useBusinessData';
import { Spinner, ErrorState } from '@/components/ScreenState';
import { Button } from '@/components/Button';

export function Inventory() {
  const { items, transactions, loading, error, reload } = useBusinessData({ items: true, transactions: true });
  const [showForm, setShowForm] = useState(false);

  if (loading) return <Spinner />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-black uppercase text-2xl md:text-4xl tracking-tighter">Inventory</h1>
        <Button variant="yellow" shape="square" onClick={() => setShowForm(true)}>
          <Plus className="h-5 w-5" /> Add Item
        </Button>
      </div>

      {items.length === 0 ? (
        <div className="bg-white border-2 md:border-4 border-black shadow-hard-4 p-8 text-center">
          <Package className="h-12 w-12 mx-auto mb-4 text-gray-400" strokeWidth={1.5} />
          <h3 className="font-bold uppercase text-lg tracking-tight mb-2">No Items Yet</h3>
          <p className="text-sm font-medium text-gray-600 mb-4">
            Add your first product to start tracking stock and getting reorder suggestions.
          </p>
          <Button variant="red" shape="square" onClick={() => setShowForm(true)}>
            <Plus className="h-5 w-5" /> Add Your First Item
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {items.map((item) => {
            const reorder = suggestReorder(item, transactions);
            const isLow = item.stock <= item.reorder_level && item.reorder_level > 0;
            const margin = item.price > 0 ? ((item.price - item.cost) / item.price) * 100 : 0;

            return (
              <div
                key={item.id}
                className="relative bg-white border-2 md:border-4 border-black shadow-hard-4 md:shadow-hard-6 p-4 md:p-5 hover:-translate-y-1 transition-all duration-200 ease-out"
              >
                {/* Corner shape */}
                <div
                  className={`absolute -top-2 -right-2 h-4 w-4 ${
                    isLow ? 'bg-primary-red' : margin < 10 ? 'bg-primary-yellow' : 'bg-primary-blue'
                  } border-2 border-black ${isLow ? 'rounded-full' : ''}`}
                />

                <h3 className="font-bold uppercase text-base tracking-tight mb-1">{item.name}</h3>
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {item.unit}
                </span>

                <div className="grid grid-cols-2 gap-3 mt-4">
                  <div className="border-2 border-black p-2 text-center">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Cost</div>
                    <div className="font-black text-sm">₹{item.cost}</div>
                  </div>
                  <div className="border-2 border-black p-2 text-center">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Price</div>
                    <div className="font-black text-sm">₹{item.price}</div>
                  </div>
                  <div className="border-2 border-black p-2 text-center">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Stock</div>
                    <div className={`font-black text-sm ${isLow ? 'text-primary-red' : ''}`}>
                      {item.stock} {item.unit}
                    </div>
                  </div>
                  <div className="border-2 border-black p-2 text-center">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Margin</div>
                    <div className={`font-black text-sm ${margin < 10 ? 'text-primary-red' : 'text-primary-blue'}`}>
                      {margin.toFixed(0)}%
                    </div>
                  </div>
                </div>

                {isLow && (
                  <div className="mt-3 flex items-start gap-2 bg-primary-red/10 border-2 border-primary-red p-2">
                    <AlertTriangle className="h-4 w-4 text-primary-red flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-bold text-primary-red">Low Stock — Reorder</p>
                      {reorder.quantity > 0 && (
                        <p className="text-xs font-medium text-gray-600">
                          {reorder.reason}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {margin < 10 && !isLow && (
                  <div className="mt-3 flex items-start gap-2 bg-primary-yellow/30 border-2 border-primary-yellow p-2">
                    <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                    <p className="text-xs font-medium">Margin below 10% — consider repricing.</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {showForm && <AddItemForm onClose={() => { setShowForm(false); reload(); }} />}
    </div>
  );
}

function AddItemForm({ onClose }: { onClose: () => void }) {
  const { business } = useAuth();
  const [name, setName] = useState('');
  const [unit, setUnit] = useState('pcs');
  const [cost, setCost] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');
  const [reorderLevel, setReorderLevel] = useState('');
  const [shelfLife, setShelfLife] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!business || !name.trim()) return;
    setSaving(true);
    setError(null);

    const { error: insertError } = await supabase.from('items').insert({
      business_id: business.id,
      name: name.trim(),
      unit,
      cost: parseFloat(cost) || 0,
      price: parseFloat(price) || 0,
      stock: parseFloat(stock) || 0,
      reorder_level: parseFloat(reorderLevel) || 0,
      shelf_life_days: shelfLife ? parseInt(shelfLife, 10) : null,
    });

    setSaving(false);
    if (insertError) {
      setError(insertError.message);
    } else {
      onClose();
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white border-2 md:border-4 border-black shadow-hard-8 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b-2 border-black p-4">
          <h2 className="font-black uppercase text-lg tracking-tighter">Add Item</h2>
          <button onClick={onClose} className="border-2 border-black p-1 active:translate-x-[2px] active:translate-y-[2px]">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {error && (
            <div className="bg-primary-red/10 border-2 border-primary-red p-3 text-sm font-medium text-primary-red">
              {error}
            </div>
          )}

          <div>
            <label className="font-bold uppercase text-xs tracking-widest mb-2 block">Name *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border-2 border-black p-3 focus:outline-none focus:shadow-hard-4 transition-all"
              placeholder="e.g. Rice 1kg"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold uppercase text-xs tracking-widest mb-2 block">Unit</label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full border-2 border-black p-3 focus:outline-none focus:shadow-hard-4"
              >
                <option value="pcs">Pieces</option>
                <option value="kg">Kilograms</option>
                <option value="g">Grams</option>
                <option value="l">Litres</option>
                <option value="m">Metres</option>
                <option value="box">Boxes</option>
              </select>
            </div>
            <div>
              <label className="font-bold uppercase text-xs tracking-widest mb-2 block">Shelf Life (days)</label>
              <input
                type="number" min="0"
                value={shelfLife}
                onChange={(e) => setShelfLife(e.target.value)}
                className="w-full border-2 border-black p-3 focus:outline-none focus:shadow-hard-4"
                placeholder="—"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold uppercase text-xs tracking-widest mb-2 block">Cost (₹)</label>
              <input
                type="number" min="0"
                step="0.01"
                value={cost}
                onChange={(e) => setCost(e.target.value)}
                className="w-full border-2 border-black p-3 focus:outline-none focus:shadow-hard-4"
                placeholder="0"
              />
            </div>
            <div>
              <label className="font-bold uppercase text-xs tracking-widest mb-2 block">Price (₹)</label>
              <input
                type="number" min="0"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full border-2 border-black p-3 focus:outline-none focus:shadow-hard-4"
                placeholder="0"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold uppercase text-xs tracking-widest mb-2 block">Stock</label>
              <input
                type="number" min="0"
                step="0.01"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                className="w-full border-2 border-black p-3 focus:outline-none focus:shadow-hard-4"
                placeholder="0"
              />
            </div>
            <div>
              <label className="font-bold uppercase text-xs tracking-widest mb-2 block">Reorder At</label>
              <input
                type="number" min="0"
                step="0.01"
                value={reorderLevel}
                onChange={(e) => setReorderLevel(e.target.value)}
                className="w-full border-2 border-black p-3 focus:outline-none focus:shadow-hard-4"
                placeholder="0"
              />
            </div>
          </div>

          <Button variant="red" shape="square" className="w-full py-3" type="submit" disabled={saving}>
            {saving ? 'Saving...' : 'Save Item'}
          </Button>
        </form>
      </div>
    </div>
  );
}
