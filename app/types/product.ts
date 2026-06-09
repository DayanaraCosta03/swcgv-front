import type { Category } from "~/types/category";

export type ProductStatus = "SIN_STOCK" | "STOCK_BAJO" | "EN_STOCK";

export interface Product {
  id: number;
  name: string;
  description: string;
  // Postgres devuelve los `decimal` como string (ej. "12.50").
  price: string;
  stock: number;
  imageUrl: string;
  categoryId: number;
  category: Category;
  status: ProductStatus;
}

export interface ProductListResponse {
  items: Product[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface ProductStats {
  total: number;
  inStock: number;
  lowStock: number;
  outOfStock: number;
}

export type ProductSortBy = "name" | "category";
export type SortOrder = "ASC" | "DESC";
