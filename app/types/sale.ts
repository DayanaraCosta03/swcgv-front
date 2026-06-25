import type { Client } from "~/types/client";
import type { Product } from "~/types/product";

export type PaymentMethod = "EFECTIVO" | "YAPE" | "PLIN" | "TRANSFERENCIA";
export type DocumentType = "BOLETA" | "FACTURA" | "TICKET";

// Etiquetas legibles para mostrar en la interfaz y los comprobantes.
export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  EFECTIVO: "Efectivo",
  YAPE: "Yape",
  PLIN: "Plin",
  TRANSFERENCIA: "Transferencia bancaria",
};

export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  BOLETA: "Boleta de venta",
  FACTURA: "Factura",
  TICKET: "Ticket",
};

export const PAYMENT_METHOD_OPTIONS = (
  Object.keys(PAYMENT_METHOD_LABELS) as PaymentMethod[]
).map((value) => ({ value, label: PAYMENT_METHOD_LABELS[value] }));

export const DOCUMENT_TYPE_OPTIONS = (
  Object.keys(DOCUMENT_TYPE_LABELS) as DocumentType[]
).map((value) => ({ value, label: DOCUMENT_TYPE_LABELS[value] }));

export interface SaleItem {
  id: number;
  quantity: number;
  // Postgres devuelve los `decimal` como string (ej. "12.50").
  unitPrice: string;
  totalPrice: string;
  product: Product;
}

export interface Sale {
  id: number;
  saleDate: string;
  totalAmount: string;
  paymentMethod: PaymentMethod;
  documentType: DocumentType;
  client?: Client | null;
  // Solo viene en el detalle (GET /sales/:id), no en el historial.
  saleItems?: SaleItem[];
}

export interface SaleListResponse {
  items: Sale[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

// --- Payload para registrar una venta (POST /sales) ---
export interface CreateSaleItem {
  productId: number;
  quantity: number;
}

export interface CreateSalePayload {
  clientId?: number;
  paymentMethod: PaymentMethod;
  documentType: DocumentType;
  items: CreateSaleItem[];
}
