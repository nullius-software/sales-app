type Product = {
    id: string;
    name: string;
    price: number;
    stock: number;
    code?: number;
};

type SelectedProduct = Product & {
    quantity: number;
};