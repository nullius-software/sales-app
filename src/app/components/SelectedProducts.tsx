'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import { SelectedProduct } from '@/interfaces/product';

interface SelectedProductsProps {
    selectedProducts: SelectedProduct[];
    isRegistering: boolean;
    onQuantityChange: (id: string, quantity: number) => void;
    onRemoveProduct: (id: string) => void;
    onRegisterSale: () => void;
}

export function SelectedProducts({
    selectedProducts,
    isRegistering,
    onQuantityChange,
    onRemoveProduct,
    onRegisterSale,
}: SelectedProductsProps) {
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);

    const calculateTotal = () => {
        return selectedProducts.reduce((total, product) => total + product.price * product.quantity, 0);
    };

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Productos Seleccionados: ({selectedProducts.length})</CardTitle>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsDetailsOpen(!isDetailsOpen)}
                    className="p-1 h-auto"
                >
                    {isDetailsOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </Button>
            </CardHeader>
            <CardContent>
                {selectedProducts.length === 0 ? (
                    <p className="text-center text-gray-500 py-4">Sin productos seleccionados</p>
                ) : (
                    <>
                        {!isDetailsOpen && (
                            <ul className="space-y-1">
                                {selectedProducts.map((product) => (
                                    <li key={product.id} className="py-1 border-b last:border-b-0">
                                        {product.name}
                                    </li>
                                ))}
                            </ul>
                        )}
                        {isDetailsOpen && (
                            <div className="space-y-3">
                                {selectedProducts.map((product) => (
                                    <div
                                        key={product.id}
                                        className="flex justify-between items-center p-3 border rounded-md"
                                    >
                                        <div className="flex-1">
                                            <p className="font-medium">{product.name}</p>
                                            <p className="text-sm text-gray-500">${product.price.toFixed(2)}</p>
                                            <p className="text-sm text-gray-500">Stock: {product.stock}</p>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => onQuantityChange(product.id, product.quantity - 1)}
                                            >
                                                -
                                            </Button>
                                            <span className="w-8 text-center">{product.quantity}</span>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => onQuantityChange(product.id, product.quantity + 1)}
                                            >
                                                +
                                            </Button>
                                            <Button
                                                variant="destructive"
                                                size="sm"
                                                onClick={() => onRemoveProduct(product.id)}
                                            >
                                                ×
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                        <div className="mt-4 pt-4 border-t">
                            <div className="flex justify-between items-center mb-4">
                                <span className="font-medium">Total:</span>
                                <span className="font-medium">${calculateTotal().toFixed(2)}</span>
                            </div>
                            <Button className="w-full" onClick={onRegisterSale} disabled={isRegistering}>
                                {isRegistering ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
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