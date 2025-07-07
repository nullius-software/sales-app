"use client";

import { useState, useEffect, useCallback } from "react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale/es";
import { toast } from "sonner";
import { useOrganizationStore } from "@/store/organizationStore";
import { SalesList } from "../../components/SalesList";
import { SaleDetails } from "../../components/SaleDetails";
import { Sale, SaleDetail } from "@/interfaces/sale";
import { PaginationData } from "@/interfaces/pagination";

export default function HistoryPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [selectedSale, setSelectedSale] = useState<SaleDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingSaleDetails, setLoadingSaleDetails] = useState(false);
  const [pagination, setPagination] = useState<PaginationData>({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
  });

  const { currentOrganization } = useOrganizationStore();

  const fetchSales = useCallback(
    async (organizationId: number, page: number = 1) => {
      if (!organizationId) return;

      try {
        setLoading(true);
        const response = await fetch(
          `/api/sales?organizationId=${organizationId}&page=${page}&limit=${pagination.limit}`,
          {
            headers: {
              "Cache-Control": "no-store",
            },
          },
        );

        if (!response.ok) {
          throw new Error("Fallo al obtener el historial de ventas");
        }

        const data = await response.json();
        setSales(data.sales);
        setPagination(data.pagination);
      } catch (err) {
        console.error(err);
        toast.error("No se pudo cargar el historial de ventas");
      } finally {
        setLoading(false);
      }
    },
    [pagination.limit],
  );

  useEffect(() => {
    if (currentOrganization?.id) {
      fetchSales(currentOrganization.id, pagination.page);
    }
  }, [currentOrganization?.id, fetchSales, pagination.page]);

  const handlePageChange = useCallback(
    (newPage: number) => {
      if (newPage < 1 || newPage > pagination.totalPages) return;
      if (currentOrganization) {
        fetchSales(currentOrganization.id, newPage);
      }
    },
    [pagination.totalPages, currentOrganization, fetchSales],
  );

  const fetchSaleDetails = useCallback(
    async (saleId: number) => {
      if (!currentOrganization) return;

      try {
        setLoadingSaleDetails(true);
        const response = await fetch(
          `/api/sales/${saleId}?organizationId=${currentOrganization.id}`,
          {
            headers: {
              "Cache-Control": "no-store",
            },
          },
        );

        if (!response.ok) {
          throw new Error("Fallo al obtener el detalle de la venta");
        }

        const { sale, products } = await response.json();
        setSelectedSale({
          ...sale,
          products,
        });
      } catch (err) {
        console.error(err);
        toast.error("No se pudo cargar el detalle de la venta.");
      } finally {
        setLoadingSaleDetails(false);
      }
    },
    [currentOrganization],
  );

  const formatDate = useCallback((dateString: string) => {
    const date = new Date(dateString);
    return formatDistanceToNow(date, { addSuffix: true, locale: es });
  }, []);

  const formatPrice = useCallback((price: number) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
    }).format(price);
  }, []);

  return (
    <div className="flex-1 p-4 md:p-6 overflow-y-auto bg-gray-50">
      {!currentOrganization ? (
        <div className="flex items-center justify-center h-full">
          <p className="text-lg text-gray-500">
            Por favor selecciona una organización para continuar
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 h-[calc(100vh-130px)]">
          <div
            className={`${selectedSale && "hidden"} md:block md:col-span-1 h-full`}
          >
            <SalesList
              sales={sales}
              selectedSaleId={selectedSale?.id || null}
              loading={loading}
              pagination={pagination}
              formatDate={formatDate}
              formatPrice={formatPrice}
              onSaleClick={fetchSaleDetails}
              onPageChange={handlePageChange}
            />
          </div>
          <div
            className={`${!selectedSale && "hidden"} md:block md:col-span-2 h-full`}
          >
            <SaleDetails
              selectedSale={selectedSale}
              loadingSaleDetails={loadingSaleDetails}
              formatPrice={formatPrice}
              onClose={() => {
                setSelectedSale(null);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
