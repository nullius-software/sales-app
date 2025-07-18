import { create } from 'zustand';
import axios from 'axios';
import { Product } from '@/interfaces/product';
import { PaginationData } from '@/interfaces/pagination';

interface SearchImage {
  src: string;
  vector: number[];
}

interface ProductState {
  products: Product[];
  searchTerm: string;
  searchImage: SearchImage | null;
  isLoading: boolean;
  pagination: PaginationData & { organizationId?: number };
  setSearchTerm: (term: string) => void;
  setSearchImage: (src: string, vector: number[] | null) => void;
  fetchProducts: (
    organizationId: number,
    page?: number,
    search?: string,
    vector?: number[] | null
  ) => Promise<void>;
  reset: () => void;
}

export const useProductStore = create<ProductState>((set, get) => ({
  products: [],
  searchTerm: '',
  searchImage: null,
  isLoading: false,
  pagination: {
    total: 0,
    page: 1,
    limit: 5,
    totalPages: 0,
  },

  setSearchTerm: (term: string) => {
    set({ searchTerm: term, searchImage: null });
    const { fetchProducts } = get();
    fetchProducts(get().pagination.organizationId || 0, 1, term);
  },

  setSearchImage: (src: string, vector: number[] | null) => {
    if (vector && vector.length !== 512) {
      console.error(`Vector must have 512 dimensions, got ${vector.length}`);
      return;
    }
    set({
      searchImage: vector ? { src, vector } : null,
      searchTerm: '',
    });
    const { fetchProducts } = get();
    fetchProducts(get().pagination.organizationId || 0, 1, undefined, vector || undefined);
  },

  fetchProducts: async (
    organizationId: number,
    page = 1,
    search = get().searchTerm,
    vector = get().searchImage?.vector || null
  ) => {
    if (!organizationId) return;

    set({ isLoading: true });
    try {
      const params: Record<string, number | string> = {
        organization_id: organizationId,
        page,
        limit: get().pagination.limit,
      };

      if (search?.trim()) {
        params.q = search;
      }
      if (vector) {
        params.vector = JSON.stringify(vector);
      }

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
      searchImage: null,
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