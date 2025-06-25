'use client';

import { useState, useMemo, useCallback, memo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp, Loader2, ScanBarcodeIcon } from 'lucide-react';
import { SelectedProduct } from '@/interfaces/product';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import BarcodeScanner from './BarcodeScanner';
import { Input } from '@/components/ui/input';

const MemoizedBarcodeScanner = memo(BarcodeScanner);
MemoizedBarcodeScanner.displayName = 'MemoizedBarcodeScanner';

const ProductList = memo(
  ({
    products,
    onQuantityChange,
    onRemoveProduct,
  }: {
    products: SelectedProduct[];
    onQuantityChange: (id: string, quantity: number) => void;
    onRemoveProduct: (id: string) => void;
  }) => {
    const [localQuantities, setLocalQuantities] = useState<Record<string, string>>({});

    useEffect(() => {
      const newQuantities: Record<string, string> = {};
      products.forEach(product => {
        newQuantities[product.id] = product.quantity.toString();
      });
      setLocalQuantities(newQuantities);
    }, [products]);

    const handleInputChange = (productId: string, value: string) => {
      setLocalQuantities(prev => ({ ...prev, [productId]: value }));
    };

    const handleBlur = (product: SelectedProduct) => {
      const rawValue = localQuantities[product.id] ?? product.quantity.toString();

      let parsedValue: number;

      if (product.unit === 'meter') {
        parsedValue = parseFloat(rawValue);
        if (isNaN(parsedValue)) parsedValue = 0;
        parsedValue = Math.min(Math.max(parsedValue, 0), product.stock);
        parsedValue = parseFloat(parsedValue.toFixed(2));
      } else {
        parsedValue = parseInt(rawValue);
        if (isNaN(parsedValue)) parsedValue = 1;
        parsedValue = Math.min(Math.max(parsedValue, 1), product.stock);
      }

      setLocalQuantities(prev => ({ ...prev, [product.id]: parsedValue.toString() }));
      onQuantityChange(product.id, parsedValue);
    };

    return (
      <div className="space-y-3">
        {products.map((product) => (
          <div
            key={product.id}
            className="p-3 border rounded-md"
          >
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-3 sm:space-y-0">
              <div className="flex-1">
                <p className="font-medium">{product.name}</p>
                <p className="text-sm text-gray-500">${product.price.toFixed(2)}</p>
                {product.unit === 'meter' ? (
                  <p className="text-sm text-gray-500">Mts: {product.stock}</p>
                ) : (
                  <p className="text-sm text-gray-500">Stock: {Number(product.stock)}</p>
                )}
              </div>

              <div className="flex flex-wrap items-center justify-end gap-2">
                <Input
                  type="number"
                  inputMode={product.unit === 'meter' ? "decimal" : "numeric"}
                  step={product.unit === 'meter' ? "0.01" : "1"}
                  value={localQuantities[product.id] ?? product.quantity.toString()}
                  onChange={(e) => handleInputChange(product.id, e.target.value)}
                  onBlur={() => handleBlur(product)}
                  className="w-20 h-8 text-center"
                  min={product.unit === 'meter' ? 0 : 1}
                />

                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => onRemoveProduct(product.id)}
                >
                  ×
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }
);

ProductList.displayName = 'ProductList';

interface SelectedProductsProps {
  selectedProducts: SelectedProduct[];
  isRegistering: boolean;
  onQuantityChange: (id: string, quantity: number) => void;
  onRemoveProduct: (id: string) => void;
  onRegisterSale: () => void;
  onBarcodeScan: (barcode: string) => void;
}

export function SelectedProducts({
  selectedProducts,
  isRegistering,
  onQuantityChange,
  onRemoveProduct,
  onRegisterSale,
  onBarcodeScan,
}: SelectedProductsProps) {
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const calculateTotal = useMemo(() => {
    return selectedProducts.reduce((total, product) => total + product.price * product.quantity, 0);
  }, [selectedProducts]);

  const handleScan = useCallback(
    (barcode: string) => {
      onBarcodeScan(barcode);
    },
    [onBarcodeScan]
  );

  const handleOpenScanner = useCallback(() => {
    setIsDialogOpen(true);
  }, []);

  const handleCloseScanner = useCallback(() => {
    setIsDialogOpen(false);
  }, []);

  return (
    <Card>
      <CardHeader className='flex flex-row items-center justify-between'>
        <CardTitle>Productos Seleccionados: ({selectedProducts.length})</CardTitle>
        <div className='flex items-center space-x-2'>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button
                variant='outline'
                size='sm'
                className='p-1 h-auto'
                onClick={handleOpenScanner}
              >
                <ScanBarcodeIcon size={18} />
              </Button>
            </DialogTrigger>
            <DialogContent className='sm:max-w-[425px] max-h-[80vh] flex flex-col'>
              <DialogHeader>
                <DialogTitle>Escanear Código de Barras</DialogTitle>
              </DialogHeader>
              <div className='py-4'>
                <MemoizedBarcodeScanner onScan={handleScan} />
              </div>
              <div className='flex-grow overflow-y-auto pr-2'>
                <ProductList
                  products={selectedProducts}
                  onQuantityChange={onQuantityChange}
                  onRemoveProduct={onRemoveProduct}
                />
              </div>
              <DialogFooter className='mt-4'>
                <Button onClick={handleCloseScanner}>Listo</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Button
            variant='ghost'
            size='sm'
            onClick={() => setIsDetailsOpen(!isDetailsOpen)}
            className='p-1 h-auto'
          >
            {isDetailsOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {selectedProducts.length === 0 ? (
          <p className='text-center text-gray-500 py-4'>Sin productos seleccionados</p>
        ) : (
          <>
            {!isDetailsOpen && (
              <ul className='space-y-1'>
                {selectedProducts.map((product) => (
                  <li key={product.id} className='py-1 border-b last:border-b-0'>
                    {product.name}
                  </li>
                ))}
              </ul>
            )}
            {isDetailsOpen && (
              <ProductList
                products={selectedProducts}
                onQuantityChange={onQuantityChange}
                onRemoveProduct={onRemoveProduct}
              />
            )}
            <div className='mt-4 pt-4 border-t'>
              <div className='flex justify-between items-center mb-4'>
                <span className='font-medium'>Total:</span>
                <span className='font-medium'>${calculateTotal.toFixed(2)}</span>
              </div>
              <Button
                className='w-full'
                onClick={onRegisterSale}
                disabled={isRegistering || selectedProducts.length === 0}
              >
                {isRegistering ? (
                  <>
                    <Loader2 className='mr-2 h-4 w-4 animate-spin' />
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
  );
}

SelectedProducts.displayName = 'SelectedProducts';