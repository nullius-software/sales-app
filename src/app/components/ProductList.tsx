'use client';

import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, ScanBarcodeIcon } from 'lucide-react';
import { Product } from '@/interfaces/product';
import { Fragment, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import BarcodeScanner from './BarcodeScanner';
import { toast } from 'sonner';
import axios from 'axios';

interface ProductListProps {
  products: Product[];
  isLoading: boolean;
  searchTerm: string;
  onSearch: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSelectProduct: (product: Product) => void;
}

export function ProductList({
  products,
  isLoading,
  searchTerm,
  onSearch,
  onSelectProduct,
}: ProductListProps) {
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [productToScan, setProductToScan] = useState<Product | null>(null);

  const isProductSellable = (product: Product) => {
    return product.stock > 0 && product.price > 0;
  };

  const handleScanButtonClick = (e: React.MouseEvent, product: Product) => {
    e.stopPropagation();
    setProductToScan(product);
    setIsScannerOpen(true);
  };

  const handleBarcodeScan = async (barcode: string) => {
    if (productToScan) {
      try {
        await axios.put(`/api/products/${productToScan.id}/barcode`, { barcode });

        toast.success('Código de barra agregado');
      /* eslint-disable @typescript-eslint/no-unused-vars */
      } catch (error) {
        toast.error('Error al actualizar el código de barra, Intentalo de nuevo más tarde');
      } finally {
        setIsScannerOpen(false);
        setProductToScan(null);
      }
    }
  };

  return (
    <Fragment>
      <Card>
        <CardHeader>
          <CardTitle>Productos</CardTitle>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" size={18} />
            <Input
              placeholder="Buscar productos..."
              value={searchTerm}
              onChange={onSearch}
              className="pl-10"
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {isLoading ? (
              <p className="text-center text-gray-500 py-4">Cargando productos...</p>
            ) : products.length === 0 ? (
              <p className="text-center text-gray-500 py-4">No se encontró ningún producto</p>
            ) : (
              products.map((product) => {
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
                    onClick={() => isSellable && onSelectProduct(product)}
                    title={disabledReason}
                  >
                    <div>
                      <p className="font-medium">{product.name}</p>
                      <p className="text-sm text-gray-500">
                        {product.price > 0 ? (
                          `$${product.price.toFixed(2)}`
                        ) : (
                          <span className="text-red-500">Sin precio</span>
                        )}
                      </p>
                    </div>
                    <div className="text-right flex items-center space-x-2">
                      <p className="text-sm text-gray-500">Stock: {product.stock}</p>
                      {!product.barcode && (
                        <button
                          onClick={(e) => handleScanButtonClick(e, product)}
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

        <Dialog open={isScannerOpen} onOpenChange={setIsScannerOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Escanear Código de Barras</DialogTitle>
              <DialogDescription>
                Apunte la cámara al código de barras del producto &quot;{productToScan?.name}&quot;.
              </DialogDescription>
            </DialogHeader>
            {isScannerOpen && <BarcodeScanner onScan={handleBarcodeScan} />}
          </DialogContent>
        </Dialog>
      </Card>
    </Fragment>
  );
}