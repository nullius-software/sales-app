'use client';

import { useState, useMemo, useCallback } from 'react';
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
import { memo } from 'react';
import { BusinessType, useOrganizationStore } from '@/store/organizationStore';
const MemoizedBarcodeScanner = memo(BarcodeScanner);
MemoizedBarcodeScanner.displayName = 'MemoizedBarcodeScanner';

const ProductList = memo(
  ({
    products,
    onQuantityChange,
    onRemoveProduct,
    businessType
  }: {
    products: SelectedProduct[];
    onQuantityChange: (id: string, quantity: number) => void;
    onRemoveProduct: (id: string) => void;
    businessType: BusinessType
  }) => (
    <div className='space-y-3'>
      {products.map((product) => (
        <div
          key={product.id}
          className='flex justify-between items-center p-3 border rounded-md'
        >
          <div className='flex-1'>
            <p className='font-medium'>{product.name}</p>
            <p className='text-sm text-gray-500'>${product.price.toFixed(2)}</p>
            {
              businessType == 'textil' ?
                <p className='text-sm text-gray-500'>Mts: {product.stock}</p> :
                <p className='text-sm text-gray-500'>Stock: {Number(product.stock)}</p>
            }
          </div>
          <div className='flex items-center space-x-2'>
            <Button
              variant='outline'
              size='sm'
              onClick={() => onQuantityChange(product.id, product.quantity - 1)}
              disabled={product.quantity <= 1}
            >
              -
            </Button>
            <span className='w-8 text-center'>{product.quantity}</span>
            <Button
              variant='outline'
              size='sm'
              onClick={() => onQuantityChange(product.id, product.quantity + 1)}
              disabled={product.quantity >= product.stock}
            >
              +
            </Button>
            <Button
              variant='destructive'
              size='sm'
              onClick={() => onRemoveProduct(product.id)}
            >
              ×
            </Button>
          </div>
        </div>
      ))}
    </div>
  )
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
  const { currentOrganization } = useOrganizationStore();

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

  if (!currentOrganization) {
    return
  }

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
            <DialogContent className='sm:max-w-[425px] max-h-[80vh] flex flex-col'> {/* Added max-h and flex-col */}
              <DialogHeader>
                <DialogTitle>Escanear Código de Barras</DialogTitle>
              </DialogHeader>
              <div className='py-4'>
                <MemoizedBarcodeScanner onScan={handleScan} />
              </div>
              <div className='flex-grow overflow-y-auto pr-2'> {/* Added flex-grow, overflow-y-auto, and pr-2 for scrollbar */}
                <ProductList
                  products={selectedProducts}
                  onQuantityChange={onQuantityChange}
                  onRemoveProduct={onRemoveProduct}
                  businessType={currentOrganization.business_type}
                />
              </div>
              <DialogFooter className='mt-4'> {/* Added mt-4 for spacing */}
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
                businessType={currentOrganization.business_type}
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