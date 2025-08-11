"use client";

import { useEffect, useMemo, useRef } from "react";
import ProductComponent from "./Product";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useProductStore } from "@/store/productStore";
import { useOrganizationStore } from "@/store/organizationStore";
import { ProductSearchBar } from "../searchbar/ProductSearchBar";
import { useSelectedProductsStore } from "@/store/selectedProductsStore";
import { PaginationControls } from "../PaginationControl";
import { Product } from "@/interfaces/product";
import { PaginationData } from "@/interfaces/pagination";
import { useRouter, useSearchParams } from "next/navigation";

interface ProductListProps {
  initialProducts: Product[];
  initialPagination: PaginationData;
}

export function ProductList({ initialProducts, initialPagination }: ProductListProps) {
  const { products, isLoading, fetchProducts, pagination, hydrate, isHydrated } =
    useProductStore();
  const { selectedProducts } = useSelectedProductsStore();
  const { currentOrganization } = useOrganizationStore();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Hydrate the store with server-fetched data only once
    if (initialProducts.length > 0 && !isHydrated) {
      hydrate(initialProducts, initialPagination);
    }
  }, [initialProducts, initialPagination, hydrate, isHydrated]);

  const productsToDisplay = useMemo(() => {
    const selectedProductIds = new Set(selectedProducts.map((p) => p.id));
    return products.filter((product) => !selectedProductIds.has(product.id));
  }, [products, selectedProducts]);

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > pagination.totalPages) return;

    const params = new URLSearchParams(searchParams);
    params.set('page', String(newPage));
    router.push(`?${params.toString()}`);
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
              {isLoading && !isHydrated ? (
                <p className="text-center text-gray-500 py-4">
                  Cargando productos...
                </p>
              ) : productsToDisplay.length === 0 ? (
                <p className="text-center text-gray-500 py-4">
                  No se encontró ningún producto. Agregalos desde el buscador.
                </p>
              ) : (
                productsToDisplay.map((product) => (
                  <ProductComponent
                    key={product.id}
                    product={product}
                  />
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
