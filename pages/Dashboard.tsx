
import React from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  AlertTriangle,
  PackageCheck,
  CreditCard,
  History,
  ShoppingCart
} from 'lucide-react';
import { StoreData } from '../types';
import { useTranslation } from '../App';

interface DashboardProps {
  data: StoreData;
}

const Dashboard: React.FC<DashboardProps> = ({ data }) => {
  const { t } = useTranslation();
  const today = new Date().toISOString().split('T')[0];
  
  const todaySales = data.sales
    .filter(s => s.date.startsWith(today))
    .reduce((sum, s) => sum + s.totalAmount, 0);
    
  const todayPurchases = data.purchases
    .filter(p => p.date.startsWith(today))
    .reduce((sum, p) => sum + p.totalCost, 0);

  const lowStockItems = data.products.filter(p => p.stock <= p.minStock).length;
  const totalCredit = data.customers.reduce((sum, c) => sum + (c.totalCredit - c.paidAmount), 0);

  const todayProfit = data.sales
    .filter(s => s.date.startsWith(today))
    .reduce((sum, s) => {
      const product = data.products.find(p => p.id === s.productId);
      const cost = product ? product.costPrice * s.quantity : 0;
      return sum + (s.totalAmount - cost);
    }, 0);

  const stats = [
    { label: t('dashboard.todaySales'), value: `${t('common.rs')} ${todaySales.toLocaleString()}`, icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: t('dashboard.todayPurchases'), value: `${t('common.rs')} ${todayPurchases.toLocaleString()}`, icon: TrendingDown, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: t('dashboard.todayProfit'), value: `${t('common.rs')} ${todayProfit.toLocaleString()}`, icon: DollarSign, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { label: t('dashboard.lowStock'), value: lowStockItems, icon: AlertTriangle, color: 'text-orange-600', bg: 'bg-orange-50' },
    { label: t('dashboard.totalCredit'), value: `${t('common.rs')} ${totalCredit.toLocaleString()}`, icon: CreditCard, color: 'text-rose-600', bg: 'bg-rose-50' },
    { label: t('dashboard.inventoryValue'), value: `${t('common.rs')} ${data.products.reduce((sum, p) => sum + (p.stock * p.costPrice), 0).toLocaleString()}`, icon: PackageCheck, color: 'text-slate-600', bg: 'bg-slate-50' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">{t('dashboard.title')}</h2>
        <p className="text-slate-500">{t('dashboard.subtitle')}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-start gap-4">
            <div className={`p-3 rounded-xl ${stat.bg} ${stat.color}`}>
              <stat.icon size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 mb-1 uppercase tracking-wider">{stat.label}</p>
              <h3 className="text-2xl font-bold text-slate-800">{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <History size={20} className="text-blue-600" />
            {t('dashboard.recentSales')}
          </h3>
          <div className="overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="py-3 font-semibold text-slate-500">{t('inventory.itemName')}</th>
                  <th className="py-3 font-semibold text-slate-500">{t('inventory.stock')}</th>
                  <th className="py-3 font-semibold text-slate-500 text-right">{t('sales.thTotal')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {data.sales.slice(-5).reverse().map((sale) => (
                  <tr key={sale.id}>
                    <td className="py-3 font-medium text-slate-700">{sale.productName}</td>
                    <td className="py-3 text-slate-500">{sale.quantity}</td>
                    <td className="py-3 text-slate-800 font-semibold text-right">{t('common.rs')} {sale.totalAmount}</td>
                  </tr>
                ))}
                {data.sales.length === 0 && (
                  <tr>
                    <td colSpan={3} className="py-8 text-center text-slate-400">{t('dashboard.noSales')}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <ShoppingCart size={20} className="text-indigo-600" />
            {t('dashboard.recentPurchases')}
          </h3>
          <div className="overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="py-3 font-semibold text-slate-500">{t('inventory.itemName')}</th>
                  <th className="py-3 font-semibold text-slate-500">{t('inventory.stock')}</th>
                  <th className="py-3 font-semibold text-slate-500 text-right">{t('purchases.thTotal')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {data.purchases.slice(-5).reverse().map((purchase) => (
                  <tr key={purchase.id}>
                    <td className="py-3 font-medium text-slate-700">{purchase.productName}</td>
                    <td className="py-3 text-slate-500">{purchase.quantity}</td>
                    <td className="py-3 text-indigo-600 font-bold text-right">{t('common.rs')} {purchase.totalCost}</td>
                  </tr>
                ))}
                {data.purchases.length === 0 && (
                  <tr>
                    <td colSpan={3} className="py-8 text-center text-slate-400">{t('dashboard.noPurchases')}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <AlertTriangle size={20} className="text-orange-500" />
            {t('dashboard.lowStockAlerts')}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {data.products.filter(p => p.stock <= p.minStock).map(p => (
              <div key={p.id} className="flex items-center justify-between p-3 bg-orange-50 rounded-xl border border-orange-100">
                <div>
                  <p className="font-bold text-orange-900">{p.name}</p>
                  <p className="text-xs text-orange-700">{t('inventory.stock')}: {p.stock} {p.unit}</p>
                </div>
                <div className="text-xs font-bold px-2 py-1 bg-orange-200 text-orange-800 rounded-full uppercase">
                  Low
                </div>
              </div>
            ))}
            {data.products.filter(p => p.stock <= p.minStock).length === 0 && (
              <div className="col-span-2 py-8 text-center text-slate-400">{t('dashboard.allHealthy')}</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
