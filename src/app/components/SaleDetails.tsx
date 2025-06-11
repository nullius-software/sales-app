'use client';

import { SaleDetail } from "@/interfaces/sale";

interface SaleDetailsProps {
  selectedSale: SaleDetail | null;
  loadingSaleDetails: boolean;
  formatPrice: (price: number) => string;
  onClose: () => void;
  isTextil: boolean;
}

export function SaleDetails({
  selectedSale,
  loadingSaleDetails,
  formatPrice,
  onClose,
  isTextil
}: SaleDetailsProps) {
  return (
    <div className="h-full">
      {selectedSale ? (
        <div className="bg-white rounded-lg shadow h-full flex flex-col">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-medium">Venta #{selectedSale.id}</h2>
              <span className="text-sm text-gray-500">
                {new Date(selectedSale.created_at).toLocaleString('es-AR', { hour12: false })}
              </span>
            </div>
          </div>
          <div className="px-6 py-4 flex-grow overflow-auto">
            <h3 className="text-md font-medium mb-3">Productos vendidos</h3>
            <div className="bg-gray-50 rounded-lg p-4 overflow-x-auto">
              {loadingSaleDetails ? (
                <div className="flex justify-center py-8">
                  <div className="animate-pulse text-gray-500">Cargando detalles...</div>
                </div>
              ) : (
                <table className="min-w-full">
                  <thead>
                    <tr>
                      <th className="text-left text-sm font-medium text-gray-500 pb-2">Producto</th>
                      <th className="text-right text-sm font-medium text-gray-500 pb-2">{isTextil ? 'Metros' : 'Cantidad'}</th>
                      <th className="text-right text-sm font-medium text-gray-500 pb-2">Precio unitario</th>
                      <th className="text-right text-sm font-medium text-gray-500 pb-2">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {selectedSale.products.map((product) => (
                      <tr key={product.id}>
                        <td className="py-2 text-sm text-gray-900">{product.name}</td>
                        <td className="py-2 text-sm text-gray-900 text-right">{product.quantity}</td>
                        <td className="py-2 text-sm text-gray-900 text-right">{formatPrice(product.unit_price)}</td>
                        <td className="py-2 text-sm text-gray-900 text-right">
                          {formatPrice(product.quantity * product.unit_price)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan={3} className="pt-4 text-right font-medium">
                        Total:
                      </td>
                      <td className="pl-1 pt-4 text-right font-bold">{formatPrice(selectedSale.total_price)}</td>
                    </tr>
                  </tfoot>
                </table>
              )}
            </div>
          </div>
          <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
            <button
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition-colors"
              onClick={onClose}
            >
              Volver a la lista
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-gray-50 rounded-lg border border-gray-200 h-full flex items-center justify-center p-8">
          <div className="text-center text-gray-500">
            <svg
              className="w-16 h-16 mx-auto text-gray-300"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
            <h3 className="mt-4 text-lg font-medium">Selecciona una venta para ver sus detalles</h3>
            <p className="mt-2">Haz click en una venta para ver una lista de sus detalles</p>
          </div>
        </div>
      )}
    </div>
  );
}