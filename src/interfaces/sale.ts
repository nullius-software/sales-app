export interface Sale {
  id: number;
  created_at: string;
  total_price: number;
  item_count: number;
}

export interface SaleDetail {
  id: number;
  created_at: string;
  total_price: number;
  products: {
    id: number;
    name: string;
    quantity: number;
    unit_price: number;
  }[];
}
