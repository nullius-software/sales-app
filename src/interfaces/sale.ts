export type Sale = {
    id: number;
    created_at: string;
    total_price: number;
    item_count: number;
};

export type SaleDetail = {
    id: number;
    created_at: string;
    total_price: number;
    products: {
        name: string;
        quantity: number;
        unit_price: number;
    }[];
};