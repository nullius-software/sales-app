export type Product = {
    id: string;
    name: string;
    price: number;
    stock: number;
    barcode?: string;
    unit: 'unit' | 'meter';
};

export type SelectedProduct = Product & {
    quantity: number;
};