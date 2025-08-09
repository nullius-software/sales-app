import { Product, SelectedProduct } from '@/interfaces/product';
import { create } from 'zustand';

interface ProductStore {
  selectedProducts: SelectedProduct[];
  setSelectedProducts: (products: SelectedProduct[]) => void;
  addSelectedProduct: (product: Product) => void;
  removeSelectedProduct: (productId: string) => void;
  clearSelectedProducts: () => void;
}

export const useSelectedProductsStore = create<ProductStore>((set) => ({
  selectedProducts: [],
  setSelectedProducts: (products) => set({ selectedProducts: products }),
  addSelectedProduct: (product) => {
    set((state) => {
      const existingProduct = state.selectedProducts.find(
        (p) => p.id === product.id
      );

      if (existingProduct) {
        if (existingProduct.quantity < product.stock) {
          return {
            selectedProducts: state.selectedProducts.map((p) =>
              p.id === product.id ? { ...p, quantity: p.quantity + 1 } : p
            ),
          };
        }
        return state;
      }

      return {
        selectedProducts: [
          ...state.selectedProducts,
          { ...product, quantity: product.stock >= 1 ? 1 : product.stock },
        ],
      };
    });
  },
  removeSelectedProduct: (productId) =>
    set((state) => ({
      selectedProducts: state.selectedProducts.filter(
        (p) => p.id !== productId
      ),
    })),
  clearSelectedProducts: () => set({ selectedProducts: [] }),
}));
