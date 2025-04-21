export type Product = {
    id: string;
    name: string;
    price: number;
    stock: number;
    code?: number;
};

export type SelectedProduct = Product & {
    quantity: number;
};