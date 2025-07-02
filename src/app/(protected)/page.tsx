'use client';

import { useState, useMemo, useEffect } from 'react';
import { toast } from 'sonner';
import axios, { AxiosError } from 'axios';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { useOrganizationStore } from '@/store/organizationStore';
import { useProductStore } from '@/store/productStore';
import Navigation from '../components/Navigation';
import { Header } from '../components/Header';
import { ProductList } from '../components/ProductList';
import { PaginationControls } from '../components/PaginationControl';
import { SelectedProducts } from '../components/SelectedProducts';
import { Product, SelectedProduct } from '@/interfaces/product';

export default function Home() {
  const [selectedProducts, setSelectedProducts] = useState<SelectedProduct[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);

  const { currentOrganization } = useOrganizationStore();
  const { products, isLoading, pagination, fetchProducts, searchTerm } = useProductStore();

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
      setSelectedProducts((prev) => [...prev, { ...product, quantity: product.stock >= 1 ? 1 : product.stock }]);
      toast(`"${product.name}" agregado a la selección`, { position: 'top-center' });
    }
  };

  const handleQuantityChange = (id: string, quantity: number) => {
    const product = selectedProducts.find((p) => p.id === id);
    if (!product) return;
    if (quantity <= 0) return;
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
      fetchProducts(currentOrganization.id, pagination.page, searchTerm);
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        toast.error(
          'Error registrando la venta'
        );
        console.error('Failed to register sale:', error);
      } else toast.error('Error registrando la venta');
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

      const product = response.data as Product;
      handleSelectProduct(product);
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
    <div className="flex h-screen w-screen">
      {!isMobile && (
        <aside className="hidden md:flex w-64 border-r flex-col h-screen sticky top-0">
          <Navigation closeMobileMenu={closeMobileMenu} />
        </aside>
      )}

      <div className="flex flex-col h-screen w-full overflow-auto">
        <Header
          isSidebarOpen={isSidebarOpen}
          setIsSidebarOpen={setIsSidebarOpen}
          isMobile={isMobile}
          closeMobileMenu={closeMobileMenu}
        />

        <main className="lg:p-6 flex-1 flex flex-col h-[calc(100vh-69px)]">
          {!currentOrganization ? (
            <div className="flex items-center justify-center flex-1">
              <p className="text-lg text-gray-500">
                Por favor, seleccioná una organización en la barra de navegación para continuar.
              </p>
            </div>
          ) : (
            <div className='h-full overflow-auto relative flex flex-col xl:flex-row xl:gap-4'>
              <div className='flex flex-col flex-1 xl:flex-7/12'>
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
              <div className='sticky bottom-2 left-0 right-0 mx-auto my-2  w-11/12 xl:w-full xl:flex-5/12 min-w-80 z-20 h-min'>
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
