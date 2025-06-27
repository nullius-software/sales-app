import { create } from 'zustand';
import { toast } from 'sonner';
import axios from 'axios';
import { Product } from '@/interfaces/product';
import { PaginationData } from '@/interfaces/pagination';

interface ProductState {
  products: Product[];
  searchTerm: string;
  isLoading: boolean;
  pagination: PaginationData & { organizationId?: number };
  setSearchTerm: (term: string) => void;
  fetchProducts: (organizationId: number, page?: number, search?: string) => Promise<void>;
  reset: () => void;
}

export const useProductStore = create<ProductState>((set, get) => ({
  products: [],
  searchTerm: '',
  isLoading: false,
  pagination: {
    total: 0,
    page: 1,
    limit: 5,
    totalPages: 0,
  },

  setSearchTerm: (term: string) => {
    set({ searchTerm: term });
    const { fetchProducts } = get();
    fetchProducts(get().pagination.organizationId || 0, 1, term);
  },

  fetchProducts: async (organizationId: number, page = 1, search = get().searchTerm) => {
    if (!organizationId) return;

    set({ isLoading: true });
    try {
      const params = {
        organization_id: organizationId,
        page,
        limit: get().pagination.limit,
        ...(search.trim() && { q: search }),
      };

      const response = await axios.get('/api/products', { params });

      set({
        products: response.data.products,
        pagination: { ...response.data.pagination, organizationId },
      });
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  reset: () => {
    set({
      products: [],
      searchTerm: '',
      isLoading: false,
      pagination: {
        total: 0,
        page: 1,
        limit: 5,
        totalPages: 0,
      },
    });
  },
}));