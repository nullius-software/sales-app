'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronDown, ChevronUp, Search } from 'lucide-react';
import { toast } from 'sonner';

type Product = {
  id: string;
  name: string;
  price: number;
  stock: number;
};

type SelectedProduct = Product & {
  quantity: number;
};

export default function Home() {
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<SelectedProduct[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const organizationId = 5;

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch(`/api/products?organization_id=${organizationId}`);
        if (!response.ok) throw new Error('Failed to fetch products');
        const data = await response.json();
        setFilteredProducts(data);
      } catch (error) {
        toast.error('Error loading products');
        console.error(error);
      }
    };
    fetchProducts();
  }, []);

  const handleSearch = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value.toLowerCase();
    setSearchTerm(term);

    try {
      const url = term.trim() === ''
        ? `/api/products?organization_id=${organizationId}`
        : `/api/products?organization_id=${organizationId}&q=${encodeURIComponent(term)}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch products');
      const data = await response.json();
      setFilteredProducts(data);
    } catch (error) {
      toast.error('Error searching products');
      console.error(error);
    }
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
      };
      setFilteredProducts(prev => [...prev, product]);
    }
  };

  const calculateTotal = () => {
    return selectedProducts.reduce((total, product) => total + product.price * product.quantity, 0);
  };

  const handleRegisterSale = async () => {
    if (selectedProducts.length === 0) {
      toast.error('Sin productos seleccionados');
      return;
    }

    try {
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
          organization_id: organizationId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to register sale');
      }

      const { totalPrice } = await response.json();
      toast.success(`Sale registered for $${totalPrice.toFixed(2)}`);

      const productsToReturn = selectedProducts.map(p => ({
        id: p.id,
        name: p.name,
        price: p.price,
        stock: p.stock,
      }));
      setFilteredProducts(prev => [...prev, ...productsToReturn]);
      setSelectedProducts([]);

      const productsResponse = await fetch(`/api/products?organization_id=${organizationId}`);
      if (productsResponse.ok) {
        const updatedProducts = await productsResponse.json();
        setFilteredProducts(updatedProducts);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error registering sale');
      console.error(error);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8 text-center">Nullius Ventas</h1>
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
                {filteredProducts.length === 0 ? (
                  <p className="text-center text-gray-500 py-4">No se encontró ningún producto</p>
                ) : (
                  filteredProducts.map(product => (
                    <div
                      key={product.id}
                      className={`flex justify-between items-center p-3 border rounded-md ${
                        product.stock > 0 ? 'cursor-pointer hover:bg-gray-50' : 'opacity-50 cursor-not-allowed'
                      }`}
                      onClick={() => product.stock > 0 && handleSelectProduct(product)}
                    >
                      <div>
                        <p className="font-medium">{product.name}</p>
                        <p className="text-sm text-gray-500">${product.price.toFixed(2)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-500">{product.stock}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
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
                    <Button className="w-full" onClick={handleRegisterSale}>
                      Registrar Venta
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}