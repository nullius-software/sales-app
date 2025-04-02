'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale/es';
import { toast } from 'sonner';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import Navigation from '@/app/components/Navigation';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Menu } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

// Types
type Sale = {
    id: number;
    created_at: string;
    total_price: number;
    item_count: number;
};

type SaleDetail = {
    id: number;
    created_at: string;
    total_price: number;
    products: {
        id: number;
        name: string;
        quantity: number;
        unit_price: number;
    }[];
};

type Organization = {
    id: number;
    name: string;
};

type PaginationData = {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
};

export default function HistoryPage() {
    const [sales, setSales] = useState<Sale[]>([]);
    const [selectedSale, setSelectedSale] = useState<SaleDetail | null>(null);
    const [loading, setLoading] = useState(false);
    const [loadingSaleDetails, setLoadingSaleDetails] = useState(false);
    const [currentOrganization, setCurrentOrganization] = useState<Organization | null>(null);
    const isMobile = useMediaQuery('(max-width: 768px)');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);


    const [pagination, setPagination] = useState<PaginationData>({
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0
    });

    const fetchSales = useCallback(async (organizationId: number, page: number = 1) => {
        if (!organizationId) return;

        try {
            setLoading(true);
            const response = await fetch(`/api/sales?organizationId=${organizationId}&page=${page}&limit=${pagination.limit}`, {
                headers: {
                    'Cache-Control': 'no-store'
                }
            });

            if (!response.ok) {
                throw new Error('Fallo al obtener el historial de ventas');
            }

            const data = await response.json();
            setSales(data.sales);
            setPagination(data.pagination);
        } catch (err) {
            console.error(err);
            toast.error('No se pudo cargar el historial de ventas');
        } finally {
            setLoading(false);
        }
    }, [pagination.limit]);

    useEffect(() => {
        if (currentOrganization?.id) {
            fetchSales(currentOrganization.id, pagination.page);
        }
    }, [currentOrganization?.id, fetchSales, pagination.page]);

    const handlePageChange = useCallback((newPage: number) => {
        if (newPage < 1 || newPage > pagination.totalPages) return;
        if (currentOrganization) {
            fetchSales(currentOrganization.id, newPage);
        }
    }, [pagination.totalPages, currentOrganization, fetchSales]);

    const fetchSaleDetails = useCallback(async (saleId: number) => {
        if (!currentOrganization) return;

        try {
            setLoadingSaleDetails(true);
            const response = await fetch(`/api/sales/${saleId}?organizationId=${currentOrganization.id}`, {
                headers: {
                    'Cache-Control': 'no-store'
                }
            });

            if (!response.ok) {
                throw new Error('Fallo al obtener el detalle de la venta');
            }

            const { sale, products } = await response.json();
            setSelectedSale({
                ...sale,
                products
            });

            if (isMobile) {
                setIsSidebarOpen(false);
            }
        } catch (err) {
            console.error(err);
            toast.error('No se pudo cargar el detalle de la venta.');
        } finally {
            setLoadingSaleDetails(false);
        }
    }, [currentOrganization, isMobile]);

    const handleOrganizationChange = useCallback((org: Organization) => {
        setCurrentOrganization(org);
        setSelectedSale(null);
        setPagination(prev => ({ ...prev, page: 1 }));
    }, []);

    const formatDate = useCallback((dateString: string) => {
        const date = new Date(dateString);
        return formatDistanceToNow(date, { addSuffix: true, locale: es });
    }, []);

    const formatPrice = useCallback((price: number) => {
        return new Intl.NumberFormat('es-AR', {
            style: 'currency',
            currency: 'ARS'
        }).format(price);
    }, []);

    // Memoized component parts to reduce re-renders
    const SalesList = useMemo(() => (
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
                            className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${selectedSale?.id === sale.id ? 'bg-blue-50' : ''}`}
                            onClick={() => fetchSaleDetails(sale.id)}
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

            {/* Pagination footer */}
            {pagination.totalPages > 1 && (
                <div className="px-4 py-3 border-t border-gray-200 bg-gray-50 flex justify-between items-center">
                    <div className="text-sm text-gray-500">
                        Mostrando {((pagination.page - 1) * pagination.limit) + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} de {pagination.total}
                    </div>
                    <div className="flex items-center space-x-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePageChange(pagination.page - 1)}
                            disabled={pagination.page <= 1}
                        >
                            <ChevronLeft size={16} />
                        </Button>
                        <span className="text-sm">
                            Página {pagination.page} de {pagination.totalPages}
                        </span>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePageChange(pagination.page + 1)}
                            disabled={pagination.page >= pagination.totalPages}
                        >
                            <ChevronRight size={16} />
                        </Button>
                    </div>
                </div>
            )}
        </div>
    ), [loading, sales, selectedSale?.id, formatDate, formatPrice, fetchSaleDetails, pagination, handlePageChange]);

    const SaleDetails = useMemo(() => (
        selectedSale ? (
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
                                        <th className="text-right text-sm font-medium text-gray-500 pb-2">Cantidad</th>
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
                                        <td colSpan={3} className="pt-4 text-right font-medium">Total:</td>
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
                        onClick={() => {
                            setSelectedSale(null);
                            if (isMobile) setIsSidebarOpen(false);
                        }}
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
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    <h3 className="mt-4 text-lg font-medium">Selecciona una venta para ver sus detalles</h3>
                    <p className="mt-2">Haz click en una venta para ver una lista de sus detalles</p>
                </div>
            </div>
        )
    ), [selectedSale, loadingSaleDetails, formatPrice, isMobile]);

    const closeMobileMenu = () => {
        setIsSidebarOpen(false);
    };

    return (
        <div className="flex h-screen overflow-hidden bg-gray-50">
            {/* Desktop Sidebar */}
            {!isMobile && (
                <aside className="hidden md:flex w-64 border-r flex-col h-screen sticky top-0 bg-white">
                    <Navigation
                        currentOrganization={currentOrganization}
                        setCurrentOrganization={handleOrganizationChange}
                        closeMobileMenu={closeMobileMenu}
                    />
                </aside>
            )}

            {/* Main content */}
            <div className="flex-1 flex flex-col min-h-screen max-h-screen overflow-hidden">
                {/* Top Navigation Bar */}
                <header className="border-b py-4 px-6 flex justify-between items-center sticky top-0 bg-white z-10 shadow-sm">
                    <div className="flex items-center">
                        {/* Mobile menu */}
                        {isMobile && (
                            <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
                                <SheetTrigger asChild>
                                    <Button variant="ghost" size="icon" className="mr-2">
                                        <Menu className="h-5 w-5" />
                                        <span className="sr-only">Toggle navigation menu</span>
                                    </Button>
                                </SheetTrigger>
                                <SheetContent side="left" className="w-[250px] p-0">
                                    <div className="sr-only">Navigation Menu</div>
                                    <Navigation
                                        currentOrganization={currentOrganization}
                                        setCurrentOrganization={handleOrganizationChange}
                                        closeMobileMenu={closeMobileMenu}
                                    />
                                </SheetContent>
                            </Sheet>
                        )}
                        <h1 className="text-xl font-bold">Historial de Ventas</h1>
                    </div>
                </header>

                <main className="flex-1 p-4 md:p-6 overflow-y-auto">
                    {!currentOrganization ? (
                        <div className="flex items-center justify-center h-full">
                            <p className="text-lg text-gray-500">Por favor selecciona una organización para continuar</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 h-[calc(100vh-130px)]">
                            <div className={`${isMobile && selectedSale ? 'hidden' : 'block'} md:col-span-1 h-full`}>
                                {SalesList}
                            </div>

                            <div className={`${isMobile && !selectedSale ? 'hidden' : 'block'} md:col-span-2 h-full`}>
                                {SaleDetails}
                            </div>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}