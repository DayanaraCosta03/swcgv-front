export interface Client {
  id: number;
  name: string;
  phoneNumber?: string;
  notes?: string;
}

export interface ClientListResponse {
  items: Client[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface ClientStats {
  total: number;
}
