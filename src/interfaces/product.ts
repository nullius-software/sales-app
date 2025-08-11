export enum ProductUnit {
  UNIT = 'unit',
  METER = 'meter',
  KILOGRAM = 'kilogram',
}

export type Product = {
  id: string;
  name: string;
  price: number;
  stock: number;
  barcode?: string;
  unit: 'unit' | 'meter' | 'kilogram';
};

export type SelectedProduct = Product & {
  quantity: number;
};
