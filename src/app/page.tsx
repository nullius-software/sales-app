'use client';

import { useState, useMemo, useEffect } from 'react';
import { toast } from 'sonner';
import axios, { AxiosError } from 'axios';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { useOrganizationStore } from '@/store/organizationStore';
import { useProductStore } from '@/store/productStore';
import Navigation from './components/Navigation';
import { Header } from './components/Header';
import { ProductList } from './components/ProductList';
import { PaginationControls } from './components/PaginationControl';
import { SelectedProducts } from './components/SelectedProducts';
import { Product, SelectedProduct } from '@/interfaces/product';

export default function Home() {
  const [selectedProducts, setSelectedProducts] = useState<SelectedProduct[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);

  const { currentOrganization } = useOrganizationStore();
  const { products, isLoading, pagination, fetchProducts } =
    useProductStore();

  const isMobile = useMediaQuery('(max-width: 768px)');

  useEffect(() => {
    if (currentOrganization) {
      fetchProducts(currentOrganization.id, 1);
    } else {
      useProductStore.getState().reset();
    }
  }, [currentOrganization, fetchProducts]);

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > pagination.totalPages) return;
    fetchProducts(currentOrganization?.id || 0, newPage);
  };

  const handleSelectProduct = (product: Product) => {
    if (product.stock <= 0) {
      toast.error(`No hay stock disponible para ${product.name}`);
      return;
    }

    const existingProduct = selectedProducts.find(p => p.id === product.id);

    if (existingProduct) {
      if (existingProduct.quantity < product.stock) {
        setSelectedProducts(prev =>
          prev.map(p =>
            p.id === product.id ? { ...p, quantity: p.quantity + 1 } : p
          )
        );
        toast(`Cantidad de "${product.name}" incrementada`);
      } else {
        toast.error(`Stock máximo para "${product.name}" es ${product.stock}`);
      }
    } else {
      setSelectedProducts((prev) => [...prev, { ...product, quantity: 1 }]);
      toast(`"${product.name}" agregado a la selección`);
    }
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
    setSelectedProducts((prev) => prev.filter((p) => p.id !== id));
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

      const response = await axios.post('/api/sales', {
        items,
        organization_id: currentOrganization.id,
      });

      const { totalPrice } = response.data;
      toast.success(`Venta registrada por $${totalPrice.toFixed(2)}`);

      setSelectedProducts([]);
      fetchProducts(currentOrganization.id, pagination.page);
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        toast.error(
          error.response?.data?.error || error.message || 'Error registrando la venta'
        );
        console.error('Failed to register sale:', error);
      } else toast.error('Error registrando la venta')
    } finally {
      setIsRegistering(false);
    }
  };

  const handleBarcodeScan = async (barcode: string) => {
    if (!currentOrganization) {
      toast.error('Por favor, seleccioná una organización para escanear');
      return;
    }

    try {
      const response = await axios.get(`/api/products/by/barcode`, {
        params: {
          barcode: barcode,
          organization_id: currentOrganization.id,
        },
      });

      const product = response.data as Product; // Assuming the API returns a Product object
      handleSelectProduct(product); // Add the found product to selected products
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        if (error.response?.status === 404) {
          toast.error(`Producto con código de barras "${barcode}" no encontrado.`);
        } else {
          toast.error(
            error.response?.data?.error || error.message || 'Error buscando producto por código de barras'
          );
        }
        console.error('Error fetching product by barcode:', error);
      } else {
        toast.error('Error buscando producto por código de barras');
        console.error('Unknown error fetching product by barcode:', error);
      }
    }
  };


  const closeMobileMenu = () => {
    setIsSidebarOpen(false);
  };

  const productsToDisplay = useMemo(() => {
    const selectedProductIds = new Set(selectedProducts.map((p) => p.id));
    return products.filter((product) => !selectedProductIds.has(product.id));
  }, [products, selectedProducts]);

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
              <p className="text-lg text-gray-500">
                Por favor, seleccioná una organización para continuar
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2">
                <ProductList
                  products={productsToDisplay}
                  isLoading={isLoading}
                  onSelectProduct={handleSelectProduct}
                />
                <PaginationControls
                  pagination={pagination}
                  onPageChange={handlePageChange}
                />
              </div>
              <div>
                <SelectedProducts
                  selectedProducts={selectedProducts}
                  isRegistering={isRegistering}
                  onQuantityChange={handleQuantityChange}
                  onRemoveProduct={handleRemoveProduct}
                  onRegisterSale={handleRegisterSale}
                  onBarcodeScan={handleBarcodeScan}
                />
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}