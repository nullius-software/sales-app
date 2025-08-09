'use client';

import { useEffect, useMemo, useRef } from 'react';
import Product from './Product';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useProductStore } from '@/store/productStore';
import { useOrganizationStore } from '@/store/organizationStore';
import { ProductSearchBar } from '../searchbar/ProductSearchBar';
import { useSelectedProductsStore } from '@/store/selectedProductsStore';
import { PaginationControls } from '../PaginationControl';

export function ProductList() {
  const { products, isLoading, fetchProducts, pagination } = useProductStore();
  const { selectedProducts } = useSelectedProductsStore();
  const { currentOrganization } = useOrganizationStore();
  const lastFetchedOrgId = useRef<number | null>(null);

  useEffect(() => {
    if (
      currentOrganization &&
      currentOrganization.id !== lastFetchedOrgId.current
    ) {
      fetchProducts(currentOrganization.id, 1);
      lastFetchedOrgId.current = currentOrganization.id;
    }
  }, [currentOrganization, fetchProducts]);

  const productsToDisplay = useMemo(() => {
    const selectedProductIds = new Set(selectedProducts.map((p) => p.id));
    return products.filter((product) => !selectedProductIds.has(product.id));
  }, [products, selectedProducts]);

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > pagination.totalPages) return;
    fetchProducts(currentOrganization?.id || 0, newPage);
  };

  return (
    <div className="flex flex-col">
      <Card className="border-0 shadow-none lg:border lg:shadow-sm">
        <CardHeader>
          <CardTitle>Productos</CardTitle>
          {currentOrganization && (
            <ProductSearchBar
              businessType={currentOrganization.business_type}
            />
          )}
        </CardHeader>
        {currentOrganization ? (
          <CardContent className="h-full lg:p-10">
            <div className="space-y-2 h-full overflow-y-auto">
              {isLoading ? (
                <p className="text-center text-gray-500 py-4">
                  Cargando productos...
                </p>
              ) : productsToDisplay.length === 0 ? (
                <p className="text-center text-gray-500 py-4">
                  No se encontró ningún producto. Agregalos desde el buscador.
                </p>
              ) : (
                productsToDisplay.map((product) => (
                  <Product key={product.id} product={product} />
                ))
              )}
            </div>
          </CardContent>
        ) : (
          <CardContent>
            <p className="text-center text-gray-500 py-4">
              Por favor, seleccioná una organización en la barra de navegación
              para continuar.
            </p>
          </CardContent>
        )}
      </Card>
      <PaginationControls
        pagination={pagination}
        onPageChange={handlePageChange}
      />
    </div>
  );
}
