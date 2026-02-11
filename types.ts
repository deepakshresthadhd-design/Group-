
export type PaymentType = 'cash' | 'credit';

export interface Product {
  id: string;
  name: string;
  category: string;
  unit: string;
  costPrice: number;
  sellPrice: number;
  stock: number;
  minStock: number;
}

export interface Purchase {
  id: string;
  productId: string;
  productName: string;
  supplierName: string;
  quantity: number;
  costPerUnit: number;
  totalCost: number;
  date: string;
  notes?: string;
}

export interface Sale {
  id: string;
  productId: string;
  productName: string;
  customerId?: string;
  customerName?: string;
  quantity: number;
  sellPrice: number;
  totalAmount: number;
  paymentType: PaymentType;
  date: string;
  notes?: string;
}

export interface CustomerPayment {
  amount: number;
  date: string;
  notes?: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  phoneAlt?: string;
  totalCredit: number;
  paidAmount: number;
  payments?: CustomerPayment[];
}

export interface StoreData {
  products: Product[];
  purchases: Purchase[];
  sales: Sale[];
  customers: Customer[];
}

export interface DailySummary {
  sales: number;
  purchases: number;
  profit: number;
  lowStockItems: number;
}
