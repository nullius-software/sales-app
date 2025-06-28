'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronDown, ChevronUp, ScanBarcodeIcon } from 'lucide-react';
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
import axios, { AxiosError } from 'axios';
import { useProductStore } from '@/store/productStore';
import { useOrganizationStore } from '@/store/organizationStore';
import { ProductSearchBar } from './ProductSearchBar';
import { Separator } from '@/components/ui/separator';
import ProductEditForm from './ProductEditForm';
import { useMediaQuery } from '@/hooks/useMediaQuery';

interface ProductListProps {
  products: Product[];
  isLoading: boolean;
  onSelectProduct: (product: Product) => void;
}

export function ProductList({
  products,
  isLoading,
  onSelectProduct,
}: ProductListProps) {
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [productToScan, setProductToScan] = useState<Product | null>(null);
  const { fetchProducts, pagination, searchTerm } = useProductStore();
  const { currentOrganization } = useOrganizationStore();
  const [expandedProductId, setExpandedProductId] = useState<string | null>(null);
  const [hoveredProductId, setHoveredProductId] = useState<string | null>(null);
  const isMobile = useMediaQuery('(max-width: 768px)');

  const isProductSellable = (product: Product) => {
    return product.stock > 0 && product.price > 0;
  };

  const handleScanButtonClick = (e: React.MouseEvent, product: Product) => {
    e.stopPropagation();
    setProductToScan(product);
    setIsScannerOpen(true);
  };

  const handleBarcodeScan = async (barcode: string) => {
    setIsScannerOpen(false);
    if (!productToScan || !currentOrganization) return;

    try {
      await axios.put(`/api/products/${productToScan.id}/barcode`, { barcode });
      await fetchProducts(currentOrganization.id, pagination.page, searchTerm);
      toast.success('Código de barra agregado');
    } catch (error) {
      if (error instanceof AxiosError && error.response?.status === 409) {
        toast.error(error.response.data.error);
      } else {
        toast.error('Error al actualizar el código de barra. Inténtalo de nuevo más tarde.');
      }
    } finally {
      setProductToScan(null);
    }
  };

  if (!currentOrganization) return null

  const handleEditProduct = () => {
    setExpandedProductId(null)
    fetchProducts(currentOrganization.id, pagination.page, searchTerm)
  }

  const handleDeleteProduct = async () => {
    try {
      const productId = expandedProductId
      setExpandedProductId(null)
      await axios.delete('/api/products/' + productId);
      toast.success('Producto eliminado')
    } catch {
      toast.error('Ocurrió un error al eliminar el producto');
    } finally {
      await fetchProducts(currentOrganization.id, pagination.page, searchTerm)
    }
  }

  return (
    <Fragment>
      <Card className='border-0 shadow-none lg:border lg:shadow-sm'>
        <CardHeader>
          <CardTitle>Productos</CardTitle>
          <ProductSearchBar businessType={currentOrganization.business_type} />
        </CardHeader>
        <CardContent className='h-full lg:p-10'>
          <div className="space-y-2 h-full overflow-y-auto">
            {isLoading ? (
              <p className="text-center text-gray-500 py-4">Cargando productos...</p>
            ) : products.length === 0 ? (
              <p className="text-center text-gray-500 py-4">No se encontró ningún producto. Agregalos desde el buscador.</p>
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
                    onMouseEnter={() => setHoveredProductId(product.id)}
                    onMouseLeave={() => setHoveredProductId(null)}
                    className={`flex flex-col border rounded-md overflow-hidden transition ${hoveredProductId === product.id
                      ? 'bg-gray-50 cursor-pointer'
                      : 'cursor-pointer'}`}
                  >
                    <div
                      className={`flex justify-between items-center p-3 transition ${!isSellable
                        && 'opacity-50 cursor-not-allowed'
                        }`}
                      onClick={() => {
                        if (isSellable) {
                          onSelectProduct(product)
                          setExpandedProductId(null)
                        }
                      }}
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
                        <p className="text-sm text-gray-500">
                          {product.unit === 'meter'
                            ? `Mts: ${product.stock}`
                            : `Stock: ${product.stock}`}
                        </p>
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

                    {(isMobile || hoveredProductId === product.id || expandedProductId === product.id) && (
                      <Fragment>
                        <Separator />
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setExpandedProductId(prev => prev === product.id ? null : product.id);
                          }}
                          className="px-3 py-2 w-full flex items-center justify-center text-sm text-gray-500 hover:text-black transition"
                        >
                          {expandedProductId === product.id ? (
                            <ChevronUp height={18} />
                          ) : (
                            <ChevronDown height={18} />
                          )}
                        </button>
                      </Fragment>
                    )}

                    {expandedProductId === product.id && (
                      <ProductEditForm organization={currentOrganization} product={product} onEditProduct={handleEditProduct} onDeleteProduct={handleDeleteProduct} />
                    )}
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