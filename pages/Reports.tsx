
import React, { useState, useMemo } from 'react';
import { BarChart3, Download, Calendar, Filter, AlertCircle } from 'lucide-react';
import { StoreData } from '../types';
import { downloadCSV } from '../db';
import { useTranslation } from '../App';

interface ReportsProps {
  data: StoreData;
}

const Reports: React.FC<ReportsProps> = ({ data }) => {
  const { t } = useTranslation();
  const [timeFrame, setTimeFrame] = useState<'day' | 'week' | 'month' | 'all'>('all');
  
  const filteredSales = useMemo(() => {
    if (timeFrame === 'all') return data.sales;
    const threshold = new Date();
    if (timeFrame === 'day') threshold.setHours(0, 0, 0, 0);
    if (timeFrame === 'week') threshold.setDate(threshold.getDate() - 7);
    if (timeFrame === 'month') threshold.setMonth(threshold.getMonth() - 1);
    
    return data.sales.filter(s => new Date(s.date) >= threshold);
  }, [data.sales, timeFrame]);

  const filteredPurchases = useMemo(() => {
    if (timeFrame === 'all') return data.purchases;
    const threshold = new Date();
    if (timeFrame === 'day') threshold.setHours(0, 0, 0, 0);
    if (timeFrame === 'week') threshold.setDate(threshold.getDate() - 7);
    if (timeFrame === 'month') threshold.setMonth(threshold.getMonth() - 1);
    
    return data.purchases.filter(p => new Date(p.date) >= threshold);
  }, [data.purchases, timeFrame]);

  const totalSalesAmount = filteredSales.reduce((sum, s) => sum + s.totalAmount, 0);
  const totalPurchasesAmount = filteredPurchases.reduce((sum, p) => sum + p.totalCost, 0);
  
  const totalProfit = filteredSales.reduce((sum, s) => {
    const product = data.products.find(p => p.id === s.productId);
    const cost = product ? product.costPrice * s.quantity : 0;
    return sum + (s.totalAmount - cost);
  }, 0);

  const exportInventory = () => {
    if (data.products.length === 0) return alert("No inventory data to export");
    const preparedData = data.products.map(p => ({
      'Product ID': p.id,
      'Name': p.name,
      'Category': p.category,
      'Unit': p.unit,
      'Cost Price': p.costPrice,
      'Selling Price': p.sellPrice,
      'Current Stock': p.stock,
      'Min Stock Alert': p.minStock
    }));
    downloadCSV('inventory_report.csv', preparedData);
  };

  const exportSales = () => {
    if (filteredSales.length === 0) return alert("No sales records found for this period");
    const preparedData = filteredSales.map(s => ({
      'Date': s.date,
      'Product': s.productName,
      'Customer': s.customerName || 'Walk-in',
      'Payment Type': s.paymentType,
      'Quantity': s.quantity,
      'Total Amount': s.totalAmount,
      'Notes': s.notes || ''
    }));
    downloadCSV(`sales_report_${timeFrame}.csv`, preparedData);
  };

  const exportPurchases = () => {
    if (filteredPurchases.length === 0) return alert("No purchase records found for this period");
    const preparedData = filteredPurchases.map(p => ({
      'Date': p.date,
      'Product': p.productName,
      'Supplier': p.supplierName || 'General',
      'Quantity': p.quantity,
      'Cost per Unit': p.costPerUnit,
      'Total Cost': p.totalCost,
      'Notes': p.notes || ''
    }));
    downloadCSV(`purchases_report_${timeFrame}.csv`, preparedData);
  };
  
  const exportCustomers = () => {
    if (data.customers.length === 0) return alert("No customer data available");
    const preparedData = data.customers.map(c => ({
      'Customer ID': c.id,
      'Customer Name': c.name,
      'Primary Phone': c.phone,
      'Alternative Phone': c.phoneAlt || '',
      'Total Credit Amount': c.totalCredit,
      'Total Paid Amount': c.paidAmount,
      'Remaining Balance (Udhar)': c.totalCredit - c.paidAmount
    }));
    downloadCSV('customer_credit_report.csv', preparedData);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">{t('reports.title')}</h2>
          <p className="text-slate-500">{t('reports.subtitle')}</p>
        </div>
        <div className="flex items-center gap-2 bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
          {['day', 'week', 'month', 'all'].map((f) => (
            <button
              key={f}
              onClick={() => setTimeFrame(f as any)}
              className={`px-4 py-2 rounded-lg text-sm font-bold uppercase tracking-wider transition-all ${
                timeFrame === f ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
              }`}
            >
              {t(`reports.${f}`)}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase mb-1">{t('reports.periodSales')}</p>
          <h3 className="text-2xl font-black text-slate-800">{t('common.rs')} {totalSalesAmount.toLocaleString()}</h3>
          <div className="mt-4 h-1 w-full bg-emerald-100 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-500" style={{ width: totalSalesAmount > 0 ? '75%' : '0%' }}></div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase mb-1">{t('reports.periodPurchases')}</p>
          <h3 className="text-2xl font-black text-slate-800">{t('common.rs')} {totalPurchasesAmount.toLocaleString()}</h3>
          <div className="mt-4 h-1 w-full bg-blue-100 rounded-full overflow-hidden">
            <div className="h-full bg-blue-500" style={{ width: totalPurchasesAmount > 0 ? '50%' : '0%' }}></div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase mb-1">{t('reports.estProfit')}</p>
          <h3 className="text-2xl font-black text-indigo-600">{t('common.rs')} {totalProfit.toLocaleString()}</h3>
          <div className="mt-4 h-1 w-full bg-indigo-100 rounded-full overflow-hidden">
            <div className="h-full bg-indigo-500" style={{ width: totalProfit > 0 ? '100%' : '0%' }}></div>
          </div>
        </div>
      </div>

      <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
        <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
          <Download size={20} className="text-blue-600" />
          {t('reports.exportTitle')}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <ExportButton 
            label={t('reports.inventoryList')} 
            onClick={exportInventory} 
            sub={t('reports.inventorySub')} 
            disabled={data.products.length === 0}
          />
          <ExportButton 
            label={t('reports.salesRecords')} 
            onClick={exportSales} 
            sub={`${t(`reports.${timeFrame}`)} report`} 
            disabled={filteredSales.length === 0}
          />
          <ExportButton 
            label={t('reports.purchaseHistory')} 
            onClick={exportPurchases} 
            sub={`${t(`reports.${timeFrame}`)} report`} 
            disabled={filteredPurchases.length === 0}
          />
          <ExportButton 
            label={t('reports.creditReport')} 
            onClick={exportCustomers} 
            sub={t('reports.customerSub')} 
            disabled={data.customers.length === 0}
          />
        </div>
      </div>

      <div className="bg-slate-100 p-6 rounded-2xl border-2 border-dashed border-slate-200 text-center">
        <BarChart3 size={40} className="mx-auto text-slate-300 mb-3" />
        <h4 className="font-bold text-slate-600">{t('reports.visualChartsSoon')}</h4>
        <p className="text-sm text-slate-400">{t('reports.visualChartsSub')}</p>
      </div>
    </div>
  );
};

const ExportButton = ({ label, onClick, sub, disabled }: { label: string, onClick: () => void, sub: string, disabled?: boolean }) => (
  <button 
    onClick={onClick}
    disabled={disabled}
    className={`group p-5 border rounded-2xl text-left transition-all shadow-sm ${
      disabled 
        ? 'bg-slate-50 border-slate-100 cursor-not-allowed opacity-60' 
        : 'bg-white border-slate-200 hover:border-blue-400 hover:bg-blue-50/50'
    }`}
  >
    <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 transition-colors ${
      disabled 
        ? 'bg-slate-100 text-slate-300' 
        : 'bg-slate-50 group-hover:bg-blue-100 text-slate-400 group-hover:text-blue-600'
    }`}>
      {disabled ? <AlertCircle size={20} /> : <Download size={20} />}
    </div>
    <p className={`font-bold leading-tight ${disabled ? 'text-slate-400' : 'text-slate-800'}`}>{label}</p>
    <p className="text-xs text-slate-400 font-medium uppercase mt-1">{sub}</p>
  </button>
);

export default Reports;
