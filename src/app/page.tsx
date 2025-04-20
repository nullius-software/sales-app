'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { useOrganizationStore } from '@/store/organizationStore';
import Navigation from './components/Navigation';
import { Header } from './components/Header';
import { ProductList } from './components/ProductList';
import { PaginationControls } from './components/PaginationControl';
import { SelectedProducts } from './components/SelectedProducts';

export default function Home() {
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<SelectedProduct[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [pagination, setPagination] = useState<PaginationData>({
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 0,
  });

  const { currentOrganization } = useOrganizationStore();
  const isMobile = useMediaQuery('(max-width: 768px)');

  const fetchProducts = useCallback(
    async (page = 1, search = searchTerm) => {
      if (!currentOrganization) return;

      setIsLoading(true);
      try {
        const url = new URL('/api/products', window.location.origin);
        url.searchParams.append('organization_id', currentOrganization.id.toString());
        url.searchParams.append('page', page.toString());
        url.searchParams.append('limit', pagination.limit.toString());

        if (search.trim()) {
          url.searchParams.append('q', search);
        }

        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch products');

        const data = await response.json();
        setFilteredProducts(data.products);
        setPagination(data.pagination);
      } catch (error) {
        toast.error('Error loading products');
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    },
    [currentOrganization, pagination.limit, searchTerm]
  );

  useEffect(() => {
    if (currentOrganization) {
      fetchProducts(1);
    }
  }, [currentOrganization, fetchProducts]);

  const handleSearch = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value.toLowerCase();
    setSearchTerm(term);
    fetchProducts(1, term);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > pagination.totalPages) return;
    fetchProducts(newPage);
  };

  const handleSelectProduct = (product: Product) => {
    if (product.stock <= 0) {
      toast.error(`No hay stock disponible para ${product.name}`);
      return;
    }

    setFilteredProducts((prev) => prev.filter((p) => p.id !== product.id));
    setSelectedProducts((prev) => [...prev, { ...product, quantity: 1 }]);
  };

  const handleQuantityChange = (id: string, quantity: number) => {
    const product = selectedProducts.find((p) => p.id === id);
    if (!product) return;
    if (quantity < 1) return;
    if (quantity > product.stock) {
      toast.error(`Stock máximo para ${product.name} es ${product.stock}`);
      return;
    }
    setSelectedProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, quantity } : p))
    );
  };

  const handleRemoveProduct = (id: string) => {
    const productToReturn = selectedProducts.find((p) => p.id === id);
    setSelectedProducts((prev) => prev.filter((p) => p.id !== id));
    if (productToReturn) {
      const product: Product = {
        id: productToReturn.id,
        name: productToReturn.name,
        price: productToReturn.price,
        stock: productToReturn.stock,
        code: productToReturn.code,
      };
      setFilteredProducts((prev) => [...prev, product]);
    }
  };

  const handleRegisterSale = async () => {
    if (!currentOrganization) {
      toast.error('Sin organización seleccionada');
      return;
    }

    if (selectedProducts.length === 0) {
      toast.error('Sin productos seleccionados');
      return;
    }

    try {
      setIsRegistering(true);
      const items = selectedProducts.map((p) => ({
        id: p.id,
        quantity: p.quantity,
        price: p.price,
      }));

      const response = await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items,
          organization_id: currentOrganization.id,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to register sale');
      }

      const { totalPrice } = await response.json();
      toast.success(`Venta registrada por $${totalPrice.toFixed(2)}`);

      setSelectedProducts([]);
      fetchProducts(pagination.page);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error registrando la venta');
      console.error(error);
    } finally {
      setIsRegistering(false);
    }
  };

  const closeMobileMenu = () => {
    setIsSidebarOpen(false);
  };

  return (
    <div className="flex h-screen">
      {!isMobile && (
        <aside className="hidden md:flex w-64 border-r flex-col h-screen sticky top-0">
          <Navigation closeMobileMenu={closeMobileMenu} />
        </aside>
      )}

      <div className="flex-1 flex flex-col min-h-screen">
        <Header
          isSidebarOpen={isSidebarOpen}
          setIsSidebarOpen={setIsSidebarOpen}
          isMobile={isMobile}
          closeMobileMenu={closeMobileMenu}
        />

        <main className="flex-1 p-6">
          {!currentOrganization ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-lg text-gray-500">Por favor, seleccioná una organización para continuar</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2">
                <ProductList
                  products={filteredProducts}
                  isLoading={isLoading}
                  searchTerm={searchTerm}
                  onSearch={handleSearch}
                  onSelectProduct={handleSelectProduct}
                />
                <PaginationControls pagination={pagination} onPageChange={handlePageChange} />
              </div>
              <div>
                <SelectedProducts
                  selectedProducts={selectedProducts}
                  isRegistering={isRegistering}
                  onQuantityChange={handleQuantityChange}
                  onRemoveProduct={handleRemoveProduct}
                  onRegisterSale={handleRegisterSale}
                />
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}