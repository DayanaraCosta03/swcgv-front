export interface Supplier {
  id: number;
  name: string;
  phoneNumber?: string;
  ruc?: string;
  email?: string;
  address?: string;
  isActive: boolean;
}

export interface SupplierListResponse {
  items: Supplier[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface SupplierStats {
  total: number;
}
