
import React, { useState, useEffect, createContext, useContext } from 'react';
import { HashRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  Users, 
  History, 
  BarChart3, 
  Store,
  Menu,
  Languages,
  X,
  Plus
} from 'lucide-react';
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import Purchases from './pages/Purchases';
import Sales from './pages/Sales';
import Customers from './pages/Customers';
import Reports from './pages/Reports';
import { loadData, saveData } from './db';
import { StoreData } from './types';
import { Language, translations } from './translations';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (path: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const useTranslation = () => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useTranslation must be used within LanguageProvider");
  return context;
};

// Fixed TypeScript error by using React.FC which includes internal React props like 'key'
const SidebarLink: React.FC<{ to: string, icon: any, label: string, active: boolean, onClick: () => void }> = ({ to, icon: Icon, label, active, onClick }) => (
  <Link 
    to={to} 
    onClick={onClick}
    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
      active 
        ? 'bg-blue-600 text-white shadow-md' 
        : 'text-slate-600 hover:bg-blue-50 hover:text-blue-600'
    }`}
  >
    <Icon size={20} />
    <span className="font-medium">{label}</span>
  </Link>
);

const App: React.FC = () => {
  const [data, setData] = useState<StoreData>(loadData());
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [language, setLanguage] = useState<Language>(() => {
    return (localStorage.getItem('app_lang') as Language) || 'en';
  });

  useEffect(() => {
    saveData(data);
  }, [data]);

  useEffect(() => {
    localStorage.setItem('app_lang', language);
  }, [language]);

  const updateData = (newData: Partial<StoreData>) => {
    setData(prev => ({ ...prev, ...newData }));
  };

  const t = (path: string): string => {
    const keys = path.split('.');
    let current: any = translations[language];
    for (const key of keys) {
      if (current[key] === undefined) return path;
      current = current[key];
    }
    return current;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      <HashRouter>
        <div className="min-h-screen flex bg-slate-50">
          {/* Mobile Sidebar Overlay */}
          {isSidebarOpen && (
            <div 
              className="fixed inset-0 bg-black/50 z-40 lg:hidden" 
              onClick={() => setIsSidebarOpen(false)}
            />
          )}

          {/* Sidebar */}
          <aside className={`
            fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 transform transition-transform duration-200 lg:translate-x-0 lg:static
            ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          `}>
            <div className="p-6">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white shadow-lg">
                  <Store size={24} />
                </div>
                <div>
                  <h1 className="font-bold text-lg text-slate-800 leading-tight">Group Mandu</h1>
                  <p className="text-xs text-slate-500 font-medium tracking-wider uppercase">Store Manager</p>
                </div>
              </div>

              <nav className="space-y-1">
                <NavLinks setIsSidebarOpen={setIsSidebarOpen} />
              </nav>
            </div>
            
            <div className="absolute bottom-0 left-0 w-full p-6 border-t border-slate-100 bg-slate-50/50">
              <p className="text-xs text-slate-400 font-medium">© 2024 Group Mandu Store</p>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1 flex flex-col min-w-0">
            <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 sticky top-0 z-30">
              <div className="flex items-center gap-4">
                <button 
                  className="lg:hidden p-2 text-slate-500 hover:bg-slate-100 rounded-md"
                  onClick={() => setIsSidebarOpen(true)}
                >
                  <Menu size={24} />
                </button>
                <div className="hidden sm:flex items-center gap-2">
                  <button 
                    onClick={() => setLanguage(language === 'en' ? 'ne' : 'en')}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-slate-200 hover:bg-slate-50 transition-colors text-xs font-bold text-slate-600"
                  >
                    <Languages size={14} />
                    {language === 'en' ? 'नेपाली' : 'English'}
                  </button>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => setLanguage(language === 'en' ? 'ne' : 'en')}
                  className="sm:hidden p-2 text-slate-500 hover:bg-slate-100 rounded-md"
                >
                  <Languages size={24} />
                </button>
                <div className="text-sm font-medium text-slate-600 hidden md:block">
                  {t('common.welcome')}, {t('common.admin')}
                </div>
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold border border-blue-200">
                  A
                </div>
              </div>
            </header>

            <div className="p-4 md:p-8 flex-1 overflow-auto">
              <Routes>
                <Route path="/" element={<Dashboard data={data} />} />
                <Route path="/inventory" element={<Inventory data={data} onUpdate={updateData} />} />
                <Route path="/purchases" element={<Purchases data={data} onUpdate={updateData} />} />
                <Route path="/sales" element={<Sales data={data} onUpdate={updateData} />} />
                <Route path="/customers" element={<Customers data={data} onUpdate={updateData} />} />
                <Route path="/reports" element={<Reports data={data} />} />
              </Routes>
            </div>
          </main>
        </div>
      </HashRouter>
    </LanguageContext.Provider>
  );
};

const NavLinks = ({ setIsSidebarOpen }: { setIsSidebarOpen: (o: boolean) => void }) => {
  const location = useLocation();
  const { t } = useTranslation();
  const paths = [
    { to: '/', icon: LayoutDashboard, label: t('nav.dashboard') },
    { to: '/inventory', icon: Package, label: t('nav.inventory') },
    { to: '/purchases', icon: ShoppingCart, label: t('nav.purchases') },
    { to: '/sales', icon: History, label: t('nav.sales') },
    { to: '/customers', icon: Users, label: t('nav.udhar') },
    { to: '/reports', icon: BarChart3, label: t('nav.reports') },
  ];

  return (
    <>
      {paths.map((path) => (
        <SidebarLink 
          key={path.to}
          to={path.to}
          icon={path.icon}
          label={path.label}
          active={location.pathname === path.to}
          onClick={() => setIsSidebarOpen(false)}
        />
      ))}
    </>
  );
};

export default App;
