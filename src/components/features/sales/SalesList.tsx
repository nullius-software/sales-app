'use client';

import { Sale } from "@/interfaces/sale";
import { PaginationControls } from "@/components/shared/PaginationControl";
import { PaginationData } from "@/interfaces/pagination";

interface SalesListProps {
  sales: Sale[];
  selectedSaleId: number | null;
  loading: boolean;
  pagination: PaginationData;
  formatDate: (dateString: string) => string;
  formatPrice: (price: number) => string;
  onSaleClick: (saleId: number) => void;
  onPageChange: (newPage: number) => void;
}

export function SalesList({
  sales,
  selectedSaleId,
  loading,
  pagination,
  formatDate,
  formatPrice,
  onSaleClick,
  onPageChange,
}: SalesListProps) {
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden h-full flex flex-col">
      <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
        <h2 className="text-lg font-medium">Ventas Recientes</h2>
      </div>
      <div className="divide-y divide-gray-200 overflow-y-auto flex-grow">
        {loading ? (
          <div className="flex justify-center my-8">
            <div className="animate-pulse text-gray-500">Cargando historial de ventas...</div>
          </div>
        ) : sales.length === 0 ? (
          <p className="p-4 text-center text-gray-500">No hay registro de ventas encontrado.</p>
        ) : (
          sales.map((sale) => (
            <div
              key={sale.id}
              className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                selectedSaleId === sale.id ? 'bg-blue-50' : ''
              }`}
              onClick={() => onSaleClick(sale.id)}
            >
              <div className="flex justify-between items-center">
                <span className="text-gray-900 font-medium">{formatPrice(sale.total_price)}</span>
                <span className="text-sm text-gray-500">{formatDate(sale.created_at)}</span>
              </div>
              <div className="text-sm text-gray-500 mt-1">
                {sale.item_count} {sale.item_count === 1 ? 'producto' : 'productos'}
              </div>
            </div>
          ))
        )}
      </div>
      <PaginationControls pagination={pagination} onPageChange={onPageChange} />
    </div>
  );
}