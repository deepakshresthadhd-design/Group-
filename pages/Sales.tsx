
import React, { useState, useMemo } from 'react';
import { History, Plus, Search, CreditCard, DollarSign, X, Filter, Calendar, RotateCcw, MessageSquare, AlignLeft } from 'lucide-react';
import { StoreData, Sale, PaymentType } from '../types';
import { useTranslation } from '../App';

interface SalesProps {
  data: StoreData;
  onUpdate: (data: Partial<StoreData>) => void;
}

const Sales: React.FC<SalesProps> = ({ data, onUpdate }) => {
  const { t } = useTranslation();
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPaymentType, setFilterPaymentType] = useState<'all' | PaymentType>('all');
  const [filterCustomerId, setFilterCustomerId] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const [formData, setFormData] = useState({
    productId: '',
    customerId: '',
    quantity: 1,
    paymentType: 'cash' as PaymentType,
    date: new Date().toISOString().split('T')[0],
    notes: ''
  });

  const filteredSales = useMemo(() => {
    const keywords = searchTerm.toLowerCase().split(/\s+/).filter(k => k.length > 0);

    return data.sales.filter(sale => {
      // Create a combined string of all searchable fields for this sale
      const searchableContent = `
        ${sale.productName} 
        ${sale.customerName || ''} 
        ${sale.notes || ''} 
        ${sale.date}
        ${sale.paymentType}
        ${sale.totalAmount}
      `.toLowerCase();

      // Check if EVERY keyword from the search input is found in the searchableContent
      const matchesSearch = keywords.every(keyword => searchableContent.includes(keyword));
      
      const matchesType = filterPaymentType === 'all' || sale.paymentType === filterPaymentType;
      
      const matchesCustomer = filterCustomerId === 'all' || sale.customerId === filterCustomerId;
      
      const matchesDateFrom = !dateFrom || sale.date >= dateFrom;
      const matchesDateTo = !dateTo || sale.date <= dateTo;

      return matchesSearch && matchesType && matchesCustomer && matchesDateFrom && matchesDateTo;
    }).slice().reverse();
  }, [data.sales, searchTerm, filterPaymentType, filterCustomerId, dateFrom, dateTo]);

  const totalFilteredAmount = useMemo(() => {
    return filteredSales.reduce((sum, s) => sum + s.totalAmount, 0);
  }, [filteredSales]);

  const clearFilters = () => {
    setSearchTerm('');
    setFilterPaymentType('all');
    setFilterCustomerId('all');
    setDateFrom('');
    setDateTo('');
  };

  const handleSave = () => {
    const product = data.products.find(p => p.id === formData.productId);
    if (!product || formData.quantity <= 0) return alert('Select a valid product and quantity');
    if (product.stock < formData.quantity) return alert('Not enough stock available!');

    const totalAmount = product.sellPrice * formData.quantity;
    
    if (formData.paymentType === 'credit' && !formData.customerId) {
      return alert('Customer must be selected for credit sales');
    }

    const newSale: Sale = {
      id: Math.random().toString(36).substr(2, 9),
      productId: product.id,
      productName: product.name,
      quantity: formData.quantity,
      sellPrice: product.sellPrice,
      totalAmount,
      paymentType: formData.paymentType,
      date: formData.date,
      notes: formData.notes.trim() || undefined,
      ...(formData.customerId && { 
        customerId: formData.customerId, 
        customerName: data.customers.find(c => c.id === formData.customerId)?.name 
      })
    };

    const updatedProducts = data.products.map(p => 
      p.id === product.id ? { ...p, stock: p.stock - formData.quantity } : p
    );

    let updatedCustomers = [...data.customers];
    if (formData.paymentType === 'credit' && formData.customerId) {
      updatedCustomers = updatedCustomers.map(c => 
        c.id === formData.customerId ? { ...c, totalCredit: c.totalCredit + totalAmount } : c
      );
    }

    onUpdate({
      sales: [...data.sales, newSale],
      products: updatedProducts,
      customers: updatedCustomers
    });

    setFormData({
      productId: '',
      customerId: '',
      quantity: 1,
      paymentType: 'cash',
      date: new Date().toISOString().split('T')[0],
      notes: ''
    });
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">{t('sales.title')}</h2>
          <p className="text-slate-500">{t('sales.subtitle')}</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-md shadow-emerald-200"
        >
          <Plus size={20} />
          {t('sales.newSaleBtn')}
        </button>
      </div>

      {/* Filter Section */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Filter size={18} className="text-blue-600" />
          <h3 className="font-bold text-slate-800 uppercase text-xs tracking-wider">Search & Filters</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search items, names, or notes (e.g. 'Rice Cash')"
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
                placeholder={t('sales.fromDate')}
              />
            </div>
            <div className="flex-1 relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <input 
                type="date" 
                className="w-full pl-8 pr-2 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                placeholder={t('sales.toDate')}
              />
            </div>
          </div>

          <div>
            <select 
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              value={filterCustomerId}
              onChange={(e) => setFilterCustomerId(e.target.value)}
            >
              <option value="all">{t('sales.filterAllCustomers')}</option>
              {data.customers.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="flex gap-2">
            <select 
              className="flex-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              value={filterPaymentType}
              onChange={(e) => setFilterPaymentType(e.target.value as any)}
            >
              <option value="all">{t('sales.filterAll')}</option>
              <option value="cash">{t('sales.cash')}</option>
              <option value="credit">{t('sales.credit')}</option>
            </select>
            <button 
              onClick={clearFilters}
              className="p-2.5 text-slate-400 hover:text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all"
              title={t('sales.clearFilters')}
            >
              <RotateCcw size={20} />
            </button>
          </div>
        </div>

        <div className="pt-2 flex flex-wrap items-center justify-between gap-4 border-t border-slate-50">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black bg-blue-100 text-blue-700 px-2 py-1 rounded-lg">
              {filteredSales.length} {t('sales.matchesFound')}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <p className="text-xs font-bold text-slate-400 uppercase">{t('sales.totalFiltered')}</p>
            <p className="text-xl font-black text-slate-800">{t('common.rs')} {totalFilteredAmount.toLocaleString()}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-6 py-4 font-bold text-slate-600 text-sm uppercase tracking-wider">{t('sales.thDate')}</th>
                <th className="px-6 py-4 font-bold text-slate-600 text-sm uppercase tracking-wider">{t('sales.thItem')}</th>
                <th className="px-6 py-4 font-bold text-slate-600 text-sm uppercase tracking-wider">{t('sales.thCustomer')}</th>
                <th className="px-6 py-4 font-bold text-slate-600 text-sm uppercase tracking-wider">{t('sales.thType')}</th>
                <th className="px-6 py-4 font-bold text-slate-600 text-sm uppercase tracking-wider text-right">{t('sales.thQty')}</th>
                <th className="px-6 py-4 font-bold text-slate-600 text-sm uppercase tracking-wider text-right">{t('sales.thTotal')}</th>
                <th className="px-6 py-4 font-bold text-slate-600 text-sm uppercase tracking-wider">{t('sales.thNotes')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSales.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 text-sm text-slate-500">{s.date}</td>
                  <td className="px-6 py-4">
                    <p className="font-bold text-slate-800">{s.productName}</p>
                    <p className="text-xs text-slate-400">{t('common.rs')} {s.sellPrice}/unit</p>
                  </td>
                  <td className="px-6 py-4 text-slate-600">{s.customerName || 'Walk-in'}</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${
                      s.paymentType === 'cash' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                    }`}>
                      {s.paymentType === 'cash' ? t('sales.cash') : t('sales.credit')}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right font-medium text-slate-700">{s.quantity}</td>
                  <td className="px-6 py-4 text-right font-bold text-slate-800">{t('common.rs')} {s.totalAmount}</td>
                  <td className="px-6 py-4">
                    {s.notes ? (
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 bg-slate-50 px-2 py-1 rounded border border-slate-100 max-w-[150px]">
                        <AlignLeft size={12} className="shrink-0" />
                        <span className="truncate" title={s.notes}>{s.notes}</span>
                      </div>
                    ) : (
                      <span className="text-slate-300">-</span>
                    )}
                  </td>
                </tr>
              ))}
              {filteredSales.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400">{t('sales.noSales')}</td>
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
              <h3 className="text-xl font-bold text-slate-800">{t('sales.modalTitle')}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={24} />
              </button>
            </div>
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div>
                <label className="block text-sm font-bold text-slate-600 mb-1">{t('sales.labelProduct')} *</label>
                <select 
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                  value={formData.productId}
                  onChange={(e) => setFormData({ ...formData, productId: e.target.value })}
                >
                  <option value="">Select a product</option>
                  {data.products.map(p => (
                    <option key={p.id} value={p.id}>{p.name} (Stock: {p.stock} {p.unit})</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-600 mb-1">{t('sales.labelQty')} *</label>
                  <input 
                    type="number" 
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-600 mb-1">{t('sales.labelPaymentType')}</label>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setFormData({ ...formData, paymentType: 'cash' })}
                      className={`flex-1 py-2.5 rounded-lg border font-bold flex items-center justify-center gap-1 transition-all ${
                        formData.paymentType === 'cash' ? 'bg-emerald-50 border-emerald-500 text-emerald-700' : 'bg-slate-50 border-slate-200 text-slate-500'
                      }`}
                    >
                      <DollarSign size={16} /> {t('sales.cash')}
                    </button>
                    <button 
                      onClick={() => setFormData({ ...formData, paymentType: 'credit' })}
                      className={`flex-1 py-2.5 rounded-lg border font-bold flex items-center justify-center gap-1 transition-all ${
                        formData.paymentType === 'credit' ? 'bg-rose-50 border-rose-500 text-rose-700' : 'bg-slate-50 border-slate-200 text-slate-500'
                      }`}
                    >
                      <CreditCard size={16} /> {t('sales.credit')}
                    </button>
                  </div>
                </div>
              </div>
              
              {formData.paymentType === 'credit' && (
                <div>
                  <label className="block text-sm font-bold text-slate-600 mb-1">{t('sales.labelSelectCustomer')} *</label>
                  <select 
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-rose-500 outline-none transition-all"
                    value={formData.customerId}
                    onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
                  >
                    <option value="">Choose customer...</option>
                    {data.customers.map(c => (
                      <option key={c.id} value={c.id}>{c.name} ({c.phone})</option>
                    ))}
                  </select>
                  <p className="mt-1 text-xs text-rose-500">{t('sales.udharAlert')}</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-bold text-slate-600 mb-1">{t('sales.labelDate')}</label>
                <input 
                  type="date" 
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-bold text-slate-600 mb-1">
                  <MessageSquare size={16} className="text-slate-400" />
                  {t('sales.labelNotes')}
                </label>
                <textarea 
                  rows={2}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none transition-all resize-none"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder={t('sales.placeholderNotes')}
                />
              </div>

              <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100 flex justify-between items-center">
                <span className="font-medium text-emerald-700">{t('sales.billAmount')}:</span>
                <span className="text-xl font-bold text-emerald-800">
                  {t('common.rs')} { (data.products.find(p => p.id === formData.productId)?.sellPrice || 0) * formData.quantity }
                </span>
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
                className="flex-1 px-4 py-2.5 font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-all shadow-md shadow-emerald-100"
              >
                {t('sales.btnFinalize')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sales;
