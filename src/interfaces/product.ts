export enum ProductUnit {
  UNIT = "unit",
  METER = "meter",
  KILOGRAM = "kilogram",
}

export interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  barcode?: string;
  unit: "unit" | "meter" | "kilogram";
}

export interface SelectedProduct extends Product {
  quantity: number;
}
