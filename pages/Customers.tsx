
import React, { useState } from 'react';
import { Users, Plus, Phone, Wallet, HandCoins, History, X, Edit2, Trash2, MessageSquare } from 'lucide-react';
import { StoreData, Customer, CustomerPayment } from '../types';
import { useTranslation } from '../App';

interface CustomersProps {
  data: StoreData;
  onUpdate: (data: Partial<StoreData>) => void;
}

const Customers: React.FC<CustomersProps> = ({ data, onUpdate }) => {
  const { t } = useTranslation();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [paymentNotes, setPaymentNotes] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    phoneAlt: '',
    initialCredit: 0
  });

  const handleOpenModal = (customer?: Customer) => {
    if (customer) {
      setEditingCustomer(customer);
      setFormData({
        name: customer.name,
        phone: customer.phone,
        phoneAlt: customer.phoneAlt || '',
        initialCredit: customer.totalCredit
      });
    } else {
      setEditingCustomer(null);
      setFormData({ name: '', phone: '', phoneAlt: '', initialCredit: 0 });
    }
    setIsModalOpen(true);
  };

  const handleSaveCustomer = () => {
    if (!formData.name) return alert('Name is required');
    
    let updatedCustomers = [...data.customers];

    if (editingCustomer) {
      updatedCustomers = updatedCustomers.map(c => 
        c.id === editingCustomer.id 
          ? { 
              ...c, 
              name: formData.name, 
              phone: formData.phone, 
              phoneAlt: formData.phoneAlt,
              totalCredit: formData.initialCredit 
            } 
          : c
      );
    } else {
      const newCustomer: Customer = {
        id: Math.random().toString(36).substr(2, 9),
        name: formData.name,
        phone: formData.phone,
        phoneAlt: formData.phoneAlt,
        totalCredit: formData.initialCredit,
        paidAmount: 0,
        payments: []
      };
      updatedCustomers.push(newCustomer);
    }

    onUpdate({ customers: updatedCustomers });
    setIsModalOpen(false);
    setEditingCustomer(null);
    setFormData({ name: '', phone: '', phoneAlt: '', initialCredit: 0 });
  };

  const handleDeleteCustomer = (id: string) => {
    if (confirm(t('udhar.deleteConfirm'))) {
      // Remove customer from customers list
      const updatedCustomers = data.customers.filter(c => c.id !== id);
      
      // Also remove all associated sales records for this customer
      const updatedSales = data.sales.filter(s => s.customerId !== id);

      onUpdate({ 
        customers: updatedCustomers,
        sales: updatedSales
      });
    }
  };

  const handlePayment = () => {
    if (!selectedCustomer || paymentAmount <= 0) return;
    
    const newPayment: CustomerPayment = {
      amount: paymentAmount,
      date: new Date().toISOString().split('T')[0],
      notes: paymentNotes.trim() || undefined
    };

    const updatedCustomers = data.customers.map(c => {
      if (c.id === selectedCustomer.id) {
        return { 
          ...c, 
          paidAmount: c.paidAmount + paymentAmount,
          payments: [...(c.payments || []), newPayment]
        };
      }
      return c;
    });

    onUpdate({ customers: updatedCustomers });
    setIsPaymentModalOpen(false);
    setPaymentAmount(0);
    setPaymentNotes('');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">{t('udhar.title')}</h2>
          <p className="text-slate-500">{t('udhar.subtitle')}</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-md shadow-blue-200"
        >
          <Plus size={20} />
          {t('udhar.addCustomerBtn')}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {data.customers.map((customer) => {
          const balance = customer.totalCredit - customer.paidAmount;
          return (
            <div key={customer.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow flex flex-col justify-between group relative">
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div className="pr-12">
                    <h3 className="text-lg font-bold text-slate-800">{customer.name}</h3>
                    <div className="space-y-1 mt-1">
                      <p className="text-slate-500 text-sm flex items-center gap-1">
                        <Phone size={14} className="text-slate-400" /> {customer.phone || 'N/A'}
                      </p>
                      {customer.phoneAlt && (
                        <p className="text-slate-500 text-sm flex items-center gap-1">
                          <Phone size={14} className="text-blue-400" /> {customer.phoneAlt}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="absolute top-6 right-6 flex flex-col items-end gap-2">
                    <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                      balance > 0 ? 'bg-rose-100 text-rose-600 border border-rose-200' : 'bg-emerald-100 text-emerald-600 border border-emerald-200'
                    }`}>
                      {balance > 0 ? t('udhar.hasUdhar') : t('udhar.cleared')}
                    </div>
                    <div className="flex items-center gap-1">
                      <button 
                        onClick={() => handleOpenModal(customer)}
                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-transparent hover:border-blue-100"
                        title="Edit Customer"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button 
                        onClick={() => handleDeleteCustomer(customer.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors border border-transparent hover:border-rose-100"
                        title="Delete Customer"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 mb-6">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">{t('udhar.totalCredit')}:</span>
                    <span className="font-medium text-slate-700">{t('common.rs')} {customer.totalCredit.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">{t('udhar.totalPaid')}:</span>
                    <span className="font-medium text-emerald-600">{t('common.rs')} {customer.paidAmount.toLocaleString()}</span>
                  </div>
                  <div className="pt-2 border-t border-slate-100 flex justify-between items-center">
                    <span className="font-bold text-slate-800 uppercase text-xs">{t('udhar.remainingBalance')}:</span>
                    <span className={`text-xl font-black ${balance > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                      {t('common.rs')} {balance.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <button 
                  onClick={() => {
                    setSelectedCustomer(customer);
                    setIsPaymentModalOpen(true);
                  }}
                  className="flex-1 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all"
                >
                  <HandCoins size={16} /> {t('udhar.btnPay')}
                </button>
                <button className="p-2 bg-slate-50 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all">
                  <History size={18} />
                </button>
              </div>
            </div>
          );
        })}
        {data.customers.length === 0 && (
          <div className="col-span-full py-16 text-center text-slate-400 border-2 border-dashed border-slate-200 rounded-3xl">
            <Users size={48} className="mx-auto mb-4 opacity-20" />
            <p>{t('udhar.noCustomers')}</p>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-xl font-bold text-slate-800">
                {editingCustomer ? t('udhar.modalTitleEdit') : t('udhar.modalTitleAdd')}
              </h3>
              <button onClick={() => { setIsModalOpen(false); setEditingCustomer(null); }} className="text-slate-400 hover:text-slate-600">
                <X size={24} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-600 mb-1">{t('udhar.labelName')} *</label>
                <input 
                  type="text" 
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Ramesh Giri"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-600 mb-1">{t('udhar.labelPhone')}</label>
                <input 
                  type="tel" 
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="Primary Number"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-600 mb-1">{t('udhar.labelPhoneAlt')}</label>
                <input 
                  type="tel" 
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  value={formData.phoneAlt}
                  onChange={(e) => setFormData({ ...formData, phoneAlt: e.target.value })}
                  placeholder="Supports Devanagari digits"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-600 mb-1">{t('udhar.labelOpeningUdhar')}</label>
                <input 
                  type="number" 
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  value={formData.initialCredit}
                  onChange={(e) => setFormData({ ...formData, initialCredit: Number(e.target.value) })}
                />
              </div>
            </div>
            <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-3">
              <button 
                onClick={() => { setIsModalOpen(false); setEditingCustomer(null); }} 
                className="flex-1 px-4 py-2.5 font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition-all"
              >
                {t('inventory.btnCancel')}
              </button>
              <button 
                onClick={handleSaveCustomer} 
                className="flex-1 px-4 py-2.5 font-bold text-white bg-blue-600 rounded-xl transition-all shadow-md shadow-blue-100"
              >
                {t('udhar.btnSave')}
              </button>
            </div>
          </div>
        </div>
      )}

      {isPaymentModalOpen && selectedCustomer && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-xl font-bold text-slate-800">{t('udhar.modalTitlePay')}</h3>
              <button onClick={() => { setIsPaymentModalOpen(false); setPaymentNotes(''); }} className="text-slate-400 hover:text-slate-600"><X size={24} /></button>
            </div>
            <div className="p-6">
              <div className="mb-6 p-4 bg-slate-50 rounded-xl">
                <p className="text-sm text-slate-500 font-medium">{t('udhar.labelPaymentFor')}</p>
                <h4 className="text-lg font-bold text-slate-800">{selectedCustomer.name}</h4>
                <p className="text-rose-600 font-bold mt-1">{t('udhar.labelCurrentBalance')}: {t('common.rs')} {(selectedCustomer.totalCredit - selectedCustomer.paidAmount).toLocaleString()}</p>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-slate-600 mb-2 text-center uppercase tracking-widest">{t('udhar.labelEnterAmount')}</label>
                  <input 
                    type="number" 
                    className="w-full text-center text-4xl font-black py-4 border-2 border-blue-100 rounded-2xl focus:border-blue-500 focus:outline-none text-blue-600"
                    autoFocus
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(Number(e.target.value))}
                  />
                </div>
                <div>
                  <label className="flex items-center gap-2 text-sm font-bold text-slate-600 mb-1">
                    <MessageSquare size={16} className="text-slate-400" />
                    {t('udhar.labelPaymentNotes')}
                  </label>
                  <input 
                    type="text" 
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    value={paymentNotes}
                    onChange={(e) => setPaymentNotes(e.target.value)}
                    placeholder={t('udhar.placeholderNotes')}
                  />
                </div>
              </div>
            </div>
            <div className="p-6 flex gap-3">
              <button onClick={() => { setIsPaymentModalOpen(false); setPaymentNotes(''); }} className="flex-1 py-3 font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition-all">{t('inventory.btnCancel')}</button>
              <button onClick={handlePayment} className="flex-1 py-3 font-bold text-white bg-emerald-600 rounded-2xl shadow-lg shadow-emerald-100 transition-all">{t('udhar.btnConfirm')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Customers;
