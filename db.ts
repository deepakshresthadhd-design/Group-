
import { StoreData, Product, Purchase, Sale, Customer } from './types';

const DB_KEY = 'group_mandu_store_data_v1';

const initialData: StoreData = {
  products: [],
  purchases: [],
  sales: [],
  customers: [],
};

export const loadData = (): StoreData => {
  const saved = localStorage.getItem(DB_KEY);
  if (!saved) return initialData;
  try {
    return JSON.parse(saved);
  } catch (e) {
    console.error("Failed to parse store data", e);
    return initialData;
  }
};

export const saveData = (data: StoreData) => {
  localStorage.setItem(DB_KEY, JSON.stringify(data));
};

export const resetData = () => {
  localStorage.removeItem(DB_KEY);
  window.location.reload();
};

// Export to CSV helper
export const downloadCSV = (filename: string, rows: any[]) => {
  if (!rows || !rows.length) return;
  const separator = ',';
  const keys = Object.keys(rows[0]);
  const csvContent = [
    keys.join(separator),
    ...rows.map(row => keys.map(k => {
      const cell = row[k] === null || row[k] === undefined ? '' : row[k];
      return `"${String(cell).replace(/"/g, '""')}"`;
    }).join(separator))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};
