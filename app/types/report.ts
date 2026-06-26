import type { PaymentMethod, DocumentType } from "~/types/sale";

export type StockStatus = "SIN_STOCK" | "STOCK_BAJO" | "EN_STOCK";

/* -------------------------------------------------------------------------- */
/* Dashboard (GET /reports/dashboard)                                         */
/* -------------------------------------------------------------------------- */

export interface DashboardData {
  sales: {
    count: number;
    revenue: number;
    todayCount: number;
    todayRevenue: number;
    monthCount: number;
    monthRevenue: number;
  };
  inventory: {
    total: number;
    inStock: number;
    lowStock: number;
    outOfStock: number;
  };
  clients: { total: number };
  salesByMonth: { month: string; revenue: number }[];
  salesByPaymentMethod: { method: PaymentMethod; revenue: number }[];
  topProducts: { id: number; name: string; quantity: number }[];
  lowStockProducts: {
    id: number;
    name: string;
    category: string;
    stock: number;
    status: StockStatus;
  }[];
}

/* -------------------------------------------------------------------------- */
/* Reportes (GET /reports/sales | /inventory | /clients)                      */
/* -------------------------------------------------------------------------- */

export interface SalesReportRow {
  id: number;
  saleDate: string;
  client: string;
  paymentMethod: PaymentMethod;
  documentType: DocumentType;
  total: number;
}

export interface InventoryReportRow {
  id: number;
  name: string;
  category: string;
  price: number;
  stock: number;
  status: StockStatus;
}

export interface InventoryReport {
  items: InventoryReportRow[];
}

export interface ClientReportRow {
  id: number;
  name: string;
  dni: string;
  phoneNumber: string;
  email: string;
  address: string;
  isActive: boolean;
}
