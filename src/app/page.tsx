'use client';

import { useState, useEffect, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { ChevronDown, ChevronUp, Search, Menu, ChevronLeft, ChevronRight, Loader2, ScanBarcodeIcon } from 'lucide-react';
import { toast } from 'sonner';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import Navigation from './components/Navigation';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { useOrganizationStore } from '@/store/organizationStore';

export default function Home() {
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<SelectedProduct[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);

  const [pagination, setPagination] = useState<PaginationData>({
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 0
  });

  const { currentOrganization } = useOrganizationStore();

  const isMobile = useMediaQuery("(max-width: 768px)");

  const fetchProducts = useCallback(async (page = 1, search = searchTerm) => {
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
  }, [currentOrganization, pagination.limit, searchTerm]);

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

  const isProductSellable = (product: Product) => {
    return product.stock > 0 && product.price > 0;
  };

  const handleSelectProduct = (product: Product) => {
    if (product.stock <= 0) {
      toast.error(`No hay stock disponible para ${product.name}`);
      return;
    }

    setFilteredProducts(prev => prev.filter(p => p.id !== product.id));
    setSelectedProducts(prev => [...prev, { ...product, quantity: 1 }]);
  };

  const handleQuantityChange = (id: string, quantity: number) => {
    const product = selectedProducts.find(p => p.id === id);
    if (!product) return;
    if (quantity < 1) return;
    if (quantity > product.stock) {
      toast.error(`Stock máximo para ${product.name} es ${product.stock}`);
      return;
    }
    setSelectedProducts(prev =>
      prev.map(p => (p.id === id ? { ...p, quantity } : p))
    );
  };

  const handleRemoveProduct = (id: string) => {
    const productToReturn = selectedProducts.find(p => p.id === id);
    setSelectedProducts(prev => prev.filter(p => p.id !== id));
    if (productToReturn) {
      const product: Product = {
        id: productToReturn.id,
        name: productToReturn.name,
        price: productToReturn.price,
        stock: productToReturn.stock,
        code: productToReturn.code
      };
      setFilteredProducts(prev => [...prev, product]);
    }
  };

  const calculateTotal = () => {
    return selectedProducts.reduce((total, product) => total + product.price * product.quantity, 0);
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
      const items = selectedProducts.map(p => ({
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
        <header className="border-b py-4 px-6 flex justify-between items-center sticky top-0 bg-white z-10">
          <div className="flex items-center">
            {isMobile && (
              <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="mr-2">
                    <Menu className="h-5 w-5" />
                    <span className="sr-only">Toggle navigation menu</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[250px] p-0">
                  <div className="sr-only">Navigation Menu</div>
                  <Navigation closeMobileMenu={closeMobileMenu} />
                </SheetContent>
              </Sheet>
            )}
            <h1 className="text-xl font-bold">Nullius Ventas</h1>
          </div>
        </header>

        <main className="flex-1 p-6">
          {!currentOrganization ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-lg text-gray-500">Por favor, seleccioná una organización para continuar</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Productos</CardTitle>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" size={18} />
                      <Input
                        placeholder="Buscar productos..."
                        value={searchTerm}
                        onChange={handleSearch}
                        className="pl-10"
                      />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 max-h-[400px] overflow-y-auto">
                      {isLoading ? (
                        <p className="text-center text-gray-500 py-4">Cargando productos...</p>
                      ) : filteredProducts.length === 0 ? (
                        <p className="text-center text-gray-500 py-4">No se encontró ningún producto</p>
                      ) : (
                        filteredProducts.map(product => {
                          const isSellable = isProductSellable(product);
                          let disabledReason = '';

                          if (product.stock <= 0) {
                            disabledReason = 'Sin stock disponible';
                          } else if (product.price <= 0) {
                            disabledReason = 'Producto sin precio';
                          }

                          return (
                            <div
                              key={product.id}
                              className={`flex justify-between items-center p-3 border rounded-md ${isSellable ? 'cursor-pointer hover:bg-gray-50' : 'opacity-50 cursor-not-allowed'
                                }`}
                              onClick={() => isSellable && handleSelectProduct(product)}
                              title={disabledReason}
                            >
                              <div>
                                <p className="font-medium">{product.name}</p>
                                <p className="text-sm text-gray-500">
                                  {product.price > 0
                                    ? `$${product.price.toFixed(2)}`
                                    : <span className="text-red-500">Sin precio</span>}
                                </p>
                              </div>
                              <div className="text-right flex items-center space-x-2">
                                <p className="text-sm text-gray-500">Stock: {product.stock}</p>
                                {!product.code && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      console.log(`Scan barcode for product ${product.id}`);
                                    }}
                                    className="p-1 border rounded-md text-gray-600 hover:bg-gray-200"
                                    title="Escanear código de barras"
                                  >
                                    <ScanBarcodeIcon className="min-w-4 h-4 w-4" />
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </CardContent>
                  {pagination.totalPages > 1 && (
                    <CardFooter className="flex justify-between items-center">
                      <div className="text-sm text-gray-500">
                        Mostrando {((pagination.page - 1) * pagination.limit) + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} de {pagination.total}
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePageChange(pagination.page - 1)}
                          disabled={pagination.page <= 1}
                        >
                          <ChevronLeft size={16} />
                        </Button>
                        <span className="text-sm">
                          Página {pagination.page} de {pagination.totalPages}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePageChange(pagination.page + 1)}
                          disabled={pagination.page >= pagination.totalPages}
                        >
                          <ChevronRight size={16} />
                        </Button>
                      </div>
                    </CardFooter>
                  )}
                </Card>
              </div>
              <div>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Productos Seleccionados: ({selectedProducts.length})</CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsDetailsOpen(!isDetailsOpen)}
                      className="p-1 h-auto"
                    >
                      {isDetailsOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </Button>
                  </CardHeader>
                  <CardContent>
                    {selectedProducts.length === 0 ? (
                      <p className="text-center text-gray-500 py-4">Sin productos seleccionados</p>
                    ) : (
                      <>
                        {!isDetailsOpen && (
                          <ul className="space-y-1">
                            {selectedProducts.map(product => (
                              <li key={product.id} className="py-1 border-b last:border-b-0">
                                {product.name}
                              </li>
                            ))}
                          </ul>
                        )}
                        {isDetailsOpen && (
                          <div className="space-y-3">
                            {selectedProducts.map(product => (
                              <div
                                key={product.id}
                                className="flex justify-between items-center p-3 border rounded-md"
                              >
                                <div className="flex-1">
                                  <p className="font-medium">{product.name}</p>
                                  <p className="text-sm text-gray-500">${product.price.toFixed(2)}</p>
                                  <p className="text-sm text-gray-500">Stock: {product.stock}</p>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleQuantityChange(product.id, product.quantity - 1)}
                                  >
                                    -
                                  </Button>
                                  <span className="w-8 text-center">{product.quantity}</span>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleQuantityChange(product.id, product.quantity + 1)}
                                  >
                                    +
                                  </Button>
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => handleRemoveProduct(product.id)}
                                  >
                                    ×
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                        <div className="mt-4 pt-4 border-t">
                          <div className="flex justify-between items-center mb-4">
                            <span className="font-medium">Total:</span>
                            <span className="font-medium">${calculateTotal().toFixed(2)}</span>
                          </div>
                          <Button
                            className="w-full"
                            onClick={handleRegisterSale}
                            disabled={isRegistering}
                          >
                            {isRegistering ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Registrando venta...
                              </>
                            ) : (
                              'Registrar Venta'
                            )}
                          </Button>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}