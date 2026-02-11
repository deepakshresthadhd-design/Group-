
import React, { useState, useMemo } from 'react';
import { Plus, Search, Edit2, Trash2, Package, X, History, TrendingUp, TrendingDown, ArrowRight } from 'lucide-react';
import { StoreData, Product } from '../types';
import { useTranslation } from '../App';

interface InventoryProps {
  data: StoreData;
  onUpdate: (data: Partial<StoreData>) => void;
}

interface StockMovement {
  id: string;
  date: string;
  type: 'purchase' | 'sale';
  quantity: number;
  entity: string;
  price: number;
}

const Inventory: React.FC<InventoryProps> = ({ data, onUpdate }) => {
  const { t } = useTranslation();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [historyProduct, setHistoryProduct] = useState<Product | null>(null);

  const [formData, setFormData] = useState<Omit<Product, 'id'>>({
    name: '',
    category: '',
    unit: 'pcs',
    costPrice: 0,
    sellPrice: 0,
    stock: 0,
    minStock: 5,
  });

  const handleOpenModal = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setFormData({ ...product });
    } else {
      setEditingProduct(null);
      setFormData({
        name: '',
        category: '',
        unit: 'pcs',
        costPrice: 0,
        sellPrice: 0,
        stock: 0,
        minStock: 5,
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (!formData.name) return alert('Name is required');

    let newProducts = [...data.products];
    if (editingProduct) {
      newProducts = newProducts.map(p => p.id === editingProduct.id ? { ...p, ...formData } : p);
    } else {
      newProducts.push({
        id: Math.random().toString(36).substr(2, 9),
        ...formData
      });
    }

    onUpdate({ products: newProducts });
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this product?')) {
      onUpdate({ products: data.products.filter(p => p.id !== id) });
    }
  };

  const filteredProducts = data.products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const productHistory = useMemo(() => {
    if (!historyProduct) return [];

    const purchases: StockMovement[] = data.purchases
      .filter(p => p.productId === historyProduct.id)
      .map(p => ({
        id: p.id,
        date: p.date,
        type: 'purchase',
        quantity: p.quantity,
        entity: p.supplierName || 'General Supplier',
        price: p.costPerUnit
      }));

    const sales: StockMovement[] = data.sales
      .filter(s => s.productId === historyProduct.id)
      .map(s => ({
        id: s.id,
        date: s.date,
        type: 'sale',
        quantity: s.quantity,
        entity: s.customerName || 'Walk-in Customer',
        price: s.sellPrice
      }));

    return [...purchases, ...sales].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [historyProduct, data.purchases, data.sales]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">{t('inventory.title')}</h2>
          <p className="text-slate-500">{t('inventory.subtitle')}</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-md shadow-blue-200"
        >
          <Plus size={20} />
          {t('inventory.addItem')}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input 
            type="text" 
            placeholder={t('inventory.searchPlaceholder')}
            className="w-full pl-12 pr-4 py-3 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 flex items-center gap-3">
          <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center text-slate-600">
            <Package size={20} />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">{t('inventory.totalItems')}</p>
            <p className="text-xl font-bold text-slate-800">{data.products.length}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-6 py-4 font-bold text-slate-600 text-sm uppercase tracking-wider">{t('inventory.itemName')}</th>
                <th className="px-6 py-4 font-bold text-slate-600 text-sm uppercase tracking-wider">{t('inventory.category')}</th>
                <th className="px-6 py-4 font-bold text-slate-600 text-sm uppercase tracking-wider">{t('inventory.costPrice')}</th>
                <th className="px-6 py-4 font-bold text-slate-600 text-sm uppercase tracking-wider">{t('inventory.sellPrice')}</th>
                <th className="px-6 py-4 font-bold text-slate-600 text-sm uppercase tracking-wider">{t('inventory.stock')}</th>
                <th className="px-6 py-4 font-bold text-slate-600 text-sm uppercase tracking-wider">{t('inventory.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProducts.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-bold text-slate-800">{p.name}</p>
                    <p className="text-xs text-slate-400">{p.unit}</p>
                  </td>
                  <td className="px-6 py-4 text-slate-600 text-sm">{p.category}</td>
                  <td className="px-6 py-4 text-slate-800 font-medium">{t('common.rs')} {p.costPrice}</td>
                  <td className="px-6 py-4 text-emerald-600 font-bold">{t('common.rs')} {p.sellPrice}</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                      p.stock <= p.minStock 
                        ? 'bg-rose-100 text-rose-600 border border-rose-200' 
                        : 'bg-emerald-100 text-emerald-600 border border-emerald-200'
                    }`}>
                      {p.stock} {p.unit}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1">
                      <button 
                        onClick={() => setHistoryProduct(p)}
                        className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                        title="Stock History"
                      >
                        <History size={18} />
                      </button>
                      <button 
                        onClick={() => handleOpenModal(p)}
                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit Product"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button 
                        onClick={() => handleDelete(p.id)}
                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Delete Product"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400 italic">{t('inventory.noProducts')}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* History Modal */}
      {historyProduct && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600">
                  <History size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-800">{historyProduct.name}</h3>
                  <p className="text-sm text-slate-500 font-medium">Stock History & Activity</p>
                </div>
              </div>
              <button onClick={() => setHistoryProduct(null)} className="text-slate-400 hover:text-slate-600 p-2 hover:bg-white rounded-full transition-colors">
                <X size={24} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-0">
              {productHistory.length > 0 ? (
                <table className="w-full text-left border-collapse">
                  <thead className="sticky top-0 bg-white border-b border-slate-100 z-10 shadow-sm">
                    <tr>
                      <th className="px-6 py-3 font-bold text-slate-500 text-xs uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 font-bold text-slate-500 text-xs uppercase tracking-wider">Activity</th>
                      <th className="px-6 py-3 font-bold text-slate-500 text-xs uppercase tracking-wider">Source/Dest</th>
                      <th className="px-6 py-3 font-bold text-slate-500 text-xs uppercase tracking-wider text-right">Change</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {productHistory.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4 text-sm text-slate-500 font-medium">{item.date}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            {item.type === 'purchase' ? (
                              <>
                                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                                  <TrendingUp size={12} />
                                </div>
                                <span className="text-sm font-bold text-blue-700 uppercase tracking-tight">Purchase</span>
                              </>
                            ) : (
                              <>
                                <div className="w-6 h-6 bg-rose-100 rounded-full flex items-center justify-center text-rose-600">
                                  <TrendingDown size={12} />
                                </div>
                                <span className="text-sm font-bold text-rose-700 uppercase tracking-tight">Sale</span>
                              </>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm text-slate-700 font-medium">{item.entity}</p>
                          <p className="text-[10px] text-slate-400 uppercase font-black">{t('common.rs')} {item.price}/unit</p>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className={`text-sm font-black ${item.type === 'purchase' ? 'text-blue-600' : 'text-rose-600'}`}>
                            {item.type === 'purchase' ? '+' : '-'}{item.quantity} {historyProduct.unit}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                  <ArrowRight size={40} className="mb-4 opacity-20" />
                  <p className="font-medium">No stock movements found for this product.</p>
                </div>
              )}
            </div>

            <div className="p-6 bg-slate-50 border-t border-slate-100">
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500 font-medium">Current Stock Level:</span>
                <span className={`px-4 py-1.5 rounded-xl font-black text-base ${
                  historyProduct.stock <= historyProduct.minStock 
                    ? 'bg-rose-100 text-rose-700' 
                    : 'bg-emerald-100 text-emerald-700'
                }`}>
                  {historyProduct.stock} {historyProduct.unit}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-xl font-bold text-slate-800">{editingProduct ? t('inventory.modalTitleEdit') : t('inventory.modalTitleAdd')}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={24} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-bold text-slate-600 mb-1">{t('inventory.labelName')} *</label>
                  <input 
                    type="text" 
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-600 mb-1">{t('inventory.labelCategory')}</label>
                  <input 
                    type="text" 
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-600 mb-1">{t('inventory.labelUnit')}</label>
                  <input 
                    type="text" 
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-600 mb-1">{t('inventory.labelCost')}</label>
                  <input 
                    type="number" 
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    value={formData.costPrice}
                    onChange={(e) => setFormData({ ...formData, costPrice: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-600 mb-1">{t('inventory.labelSell')}</label>
                  <input 
                    type="number" 
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    value={formData.sellPrice}
                    onChange={(e) => setFormData({ ...formData, sellPrice: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-600 mb-1">{t('inventory.labelOpeningStock')}</label>
                  <input 
                    type="number" 
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-600 mb-1">{t('inventory.labelMinStock')}</label>
                  <input 
                    type="number" 
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    value={formData.minStock}
                    onChange={(e) => setFormData({ ...formData, minStock: Number(e.target.value) })}
                  />
                </div>
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
                className="flex-1 px-4 py-2.5 font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-md shadow-blue-100"
              >
                {t('inventory.btnSave')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;
