
import React, { useState, useMemo } from 'react';
import { ShoppingCart, Plus, Search, Calendar, X, Edit2, Trash2, Filter, RotateCcw, MessageSquare, AlignLeft } from 'lucide-react';
import { StoreData, Purchase, Product } from '../types';
import { useTranslation } from '../App';

interface PurchasesProps {
  data: StoreData;
  onUpdate: (data: Partial<StoreData>) => void;
}

const Purchases: React.FC<PurchasesProps> = ({ data, onUpdate }) => {
  const { t } = useTranslation();
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // History Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  
  const [editingPurchase, setEditingPurchase] = useState<Purchase | null>(null);
  const [formData, setFormData] = useState({
    productId: '',
    supplierName: '',
    quantity: 0,
    costPerUnit: 0,
    date: new Date().toISOString().split('T')[0],
    notes: ''
  });

  const filteredPurchases = useMemo(() => {
    const keywords = searchTerm.toLowerCase().split(/\s+/).filter(k => k.length > 0);

    return data.purchases.filter(p => {
      // Create a combined string of all searchable fields for this purchase
      const searchableContent = `
        ${p.productName} 
        ${p.supplierName || ''} 
        ${p.notes || ''} 
        ${p.date}
        ${p.totalCost}
        ${p.quantity}
      `.toLowerCase();

      // Check if EVERY keyword from the search input is found in the searchableContent
      const matchesSearch = keywords.every(keyword => searchableContent.includes(keyword));
      
      const matchesDateFrom = !dateFrom || p.date >= dateFrom;
      const matchesDateTo = !dateTo || p.date <= dateTo;

      return matchesSearch && matchesDateFrom && matchesDateTo;
    }).slice().reverse();
  }, [data.purchases, searchTerm, dateFrom, dateTo]);

  const totalFilteredAmount = useMemo(() => {
    return filteredPurchases.reduce((sum, p) => sum + p.totalCost, 0);
  }, [filteredPurchases]);

  const clearFilters = () => {
    setSearchTerm('');
    setDateFrom('');
    setDateTo('');
  };

  const handleOpenModal = (purchase?: Purchase) => {
    if (purchase) {
      setEditingPurchase(purchase);
      setFormData({
        productId: purchase.productId,
        supplierName: purchase.supplierName,
        quantity: purchase.quantity,
        costPerUnit: purchase.costPerUnit,
        date: purchase.date,
        notes: purchase.notes || ''
      });
    } else {
      setEditingPurchase(null);
      setFormData({
        productId: '',
        supplierName: '',
        quantity: 0,
        costPerUnit: 0,
        date: new Date().toISOString().split('T')[0],
        notes: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = () => {
    const product = data.products.find(p => p.id === formData.productId);
    if (!product || formData.quantity <= 0) return alert('Valid product and quantity required');

    let updatedPurchases = [...data.purchases];
    let updatedProducts = [...data.products];

    if (editingPurchase) {
      const oldProduct = updatedProducts.find(p => p.id === editingPurchase.productId);
      if (oldProduct) {
        oldProduct.stock -= editingPurchase.quantity;
      }

      const newProduct = updatedProducts.find(p => p.id === formData.productId);
      if (newProduct) {
        newProduct.stock += formData.quantity;
        newProduct.costPrice = formData.costPerUnit;
      }

      updatedPurchases = updatedPurchases.map(p => 
        p.id === editingPurchase.id 
          ? { 
              ...p, 
              productId: formData.productId,
              productName: product.name,
              supplierName: formData.supplierName,
              quantity: formData.quantity,
              costPerUnit: formData.costPerUnit,
              totalCost: formData.quantity * formData.costPerUnit,
              date: formData.date,
              notes: formData.notes.trim() || undefined
            } 
          : p
      );
    } else {
      const newPurchase: Purchase = {
        id: Math.random().toString(36).substr(2, 9),
        productId: product.id,
        productName: product.name,
        supplierName: formData.supplierName,
        quantity: formData.quantity,
        costPerUnit: formData.costPerUnit,
        totalCost: formData.quantity * formData.costPerUnit,
        date: formData.date,
        notes: formData.notes.trim() || undefined
      };

      updatedProducts = updatedProducts.map(p => 
        p.id === product.id ? { ...p, stock: p.stock + formData.quantity, costPrice: formData.costPerUnit } : p
      );
      updatedPurchases.push(newPurchase);
    }

    onUpdate({
      purchases: updatedPurchases,
      products: updatedProducts
    });

    setIsModalOpen(false);
  };

  const handleDelete = (purchase: Purchase) => {
    if (!confirm('Are you sure you want to delete this purchase record? Inventory stock will be reduced.')) return;

    const updatedProducts = data.products.map(p => 
      p.id === purchase.productId ? { ...p, stock: Math.max(0, p.stock - purchase.quantity) } : p
    );

    const updatedPurchases = data.purchases.filter(p => p.id !== purchase.id);

    onUpdate({
      purchases: updatedPurchases,
      products: updatedProducts
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">{t('purchases.title')}</h2>
          <p className="text-slate-500">{t('purchases.subtitle')}</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-md shadow-blue-200"
        >
          <Plus size={20} />
          {t('purchases.recordBtn')}
        </button>
      </div>

      {/* History Search & Filter Section */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Filter size={18} className="text-blue-600" />
          <h3 className="font-bold text-slate-800 uppercase text-xs tracking-wider">History Filters</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search by product, supplier, or notes (e.g. 'Rice General')"
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <input 
                type="date" 
                className="w-full pl-8 pr-2 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>
            <div className="flex-1 relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <input 
                type="date" 
                className="w-full pl-8 pr-2 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
          </div>

          <div className="flex gap-2">
            <button 
              onClick={clearFilters}
              className="px-4 py-2.5 text-slate-400 hover:text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all flex items-center justify-center gap-2 font-bold text-sm"
            >
              <RotateCcw size={16} /> {t('sales.clearFilters')}
            </button>
          </div>
        </div>

        <div className="pt-2 flex flex-wrap items-center justify-between gap-4 border-t border-slate-50">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black bg-blue-100 text-blue-700 px-2 py-1 rounded-lg">
              {filteredPurchases.length} {t('purchases.matchesFound')}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <p className="text-xs font-bold text-slate-400 uppercase">{t('purchases.totalFiltered')}</p>
            <p className="text-xl font-black text-indigo-600">{t('common.rs')} {totalFilteredAmount.toLocaleString()}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-6 py-4 font-bold text-slate-600 text-sm uppercase tracking-wider">{t('purchases.thDate')}</th>
                <th className="px-6 py-4 font-bold text-slate-600 text-sm uppercase tracking-wider">{t('purchases.thProduct')}</th>
                <th className="px-6 py-4 font-bold text-slate-600 text-sm uppercase tracking-wider">{t('purchases.thSupplier')}</th>
                <th className="px-6 py-4 font-bold text-slate-600 text-sm uppercase tracking-wider text-right">{t('purchases.thQty')}</th>
                <th className="px-6 py-4 font-bold text-slate-600 text-sm uppercase tracking-wider text-right">{t('purchases.thCostUnit')}</th>
                <th className="px-6 py-4 font-bold text-slate-600 text-sm uppercase tracking-wider text-right">{t('purchases.thTotal')}</th>
                <th className="px-6 py-4 font-bold text-slate-600 text-sm uppercase tracking-wider">{t('purchases.thNotes')}</th>
                <th className="px-6 py-4 font-bold text-slate-600 text-sm uppercase tracking-wider">{t('inventory.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPurchases.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 text-sm text-slate-500">{p.date}</td>
                  <td className="px-6 py-4 font-bold text-slate-800">{p.productName}</td>
                  <td className="px-6 py-4 text-slate-600">{p.supplierName || 'General'}</td>
                  <td className="px-6 py-4 text-right font-medium text-slate-700">{p.quantity}</td>
                  <td className="px-6 py-4 text-right text-slate-600">{t('common.rs')} {p.costPerUnit}</td>
                  <td className="px-6 py-4 text-right font-bold text-indigo-600">{t('common.rs')} {p.totalCost}</td>
                  <td className="px-6 py-4">
                    {p.notes ? (
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 bg-slate-50 px-2 py-1 rounded border border-slate-100 max-w-[150px]">
                        <AlignLeft size={12} className="shrink-0" />
                        <span className="truncate" title={p.notes}>{p.notes}</span>
                      </div>
                    ) : (
                      <span className="text-slate-300">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => handleOpenModal(p)}
                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit Record"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button 
                        onClick={() => handleDelete(p)}
                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Delete Record"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredPurchases.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-slate-400 italic">{t('purchases.noPurchases')}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <ShoppingCart className="text-blue-600" size={24} />
                {editingPurchase ? t('inventory.modalTitleEdit') : t('purchases.modalTitle')}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={24} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-600 mb-1">{t('purchases.labelProduct')} *</label>
                <select 
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
                  value={formData.productId}
                  onChange={(e) => {
                    const prod = data.products.find(p => p.id === e.target.value);
                    setFormData({ ...formData, productId: e.target.value, costPerUnit: prod?.costPrice || 0 });
                  }}
                >
                  <option value="">Select a product</option>
                  {data.products.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-600 mb-1">{t('purchases.labelSupplier')}</label>
                <input 
                  type="text" 
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
                  value={formData.supplierName}
                  onChange={(e) => setFormData({ ...formData, supplierName: e.target.value })}
                  placeholder="Optional"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-600 mb-1">{t('purchases.labelQty')} *</label>
                  <input 
                    type="number" 
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-600 mb-1">{t('purchases.labelCostUnit')} *</label>
                  <input 
                    type="number" 
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
                    value={formData.costPerUnit}
                    onChange={(e) => setFormData({ ...formData, costPerUnit: Number(e.target.value) })}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-600 mb-1">{t('purchases.labelDate')}</label>
                <input 
                  type="date" 
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                />
              </div>
              <div>
                <label className="flex items-center gap-2 text-sm font-bold text-slate-600 mb-1">
                  <MessageSquare size={16} className="text-slate-400" />
                  {t('purchases.labelNotes')}
                </label>
                <textarea 
                  rows={3}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all resize-none"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder={t('purchases.placeholderNotes')}
                />
              </div>
              <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-100 flex justify-between items-center">
                <span className="font-medium text-indigo-700">{t('purchases.totalPurchaseValue')}:</span>
                <span className="text-xl font-bold text-indigo-800">{t('common.rs')} {(formData.quantity * formData.costPerUnit).toLocaleString()}</span>
              </div>
            </div>
            <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-3">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="flex-1 px-4 py-2.5 font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition-all"
              >
                {t('inventory.btnCancel')}
              </button>
              <button 
                onClick={handleSave}
                className="flex-1 px-4 py-2.5 font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md shadow-blue-100 transition-all"
              >
                {t('purchases.btnSave')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Purchases;
