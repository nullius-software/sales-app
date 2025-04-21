export type Product = {
    id: string;
    name: string;
    price: number;
    stock: number;
    barcode?: string;
};

export type SelectedProduct = Product & {
    quantity: number;
};