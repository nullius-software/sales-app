'use client';

import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Product } from '@/interfaces/product';
import { z } from 'zod';
import { getProductSchema } from '@/lib/validations/productSchema';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import axios from 'axios';
import { toast } from 'sonner';
import { useProductStore } from '@/store/productStore';

interface ProductEditFormProps {
    product: Product;
    isTextil: boolean;
    onEditProduct: () => void;
}

export default function ProductEditForm({ product, isTextil, onEditProduct }: ProductEditFormProps) {
    const productSchema = getProductSchema(isTextil);
    type ProductFormData = z.infer<typeof productSchema>;

    const {
        register,
        handleSubmit,
        formState: { errors, isValid, isSubmitting },
        setValue
    } = useForm<ProductFormData>({
        resolver: zodResolver(productSchema),
        defaultValues: {
            name: product.name,
            price: product.price,
            stock: product.stock,
        },
    });

    const onSubmit = async (data: ProductFormData) => {
        try {
            await axios.put(`/api/products/${product.id}`, data);
            toast.success('Producto actualizado correctamente');
            onEditProduct()
        } catch (error: any) {
            if (axios.isAxiosError(error)) {
                const status = error.response?.status;
                const msg = error.response?.data?.error || 'Error desconocido';

                if (status === 400 && error.response?.data?.issues) {
                    toast.error('Error de validación. Revisa los campos.');
                    console.error('Zod issues:', error.response.data.issues);
                } else if (status === 404) {
                    toast.error('Producto no encontrado.');
                } else {
                    toast.error(msg);
                }
            } else {
                toast.error('Error inesperado al actualizar el producto.');
                console.error(error);
            }
        }
    };

    const handleNormalizedChange = (name: 'stock' | 'price') => (e: React.ChangeEvent<HTMLInputElement>) => {
        let val = e.target.value;

        if (val === '') {
            setValue(name, 0, { shouldValidate: true });
            return;
        }

        if (val.length > 1 && val.startsWith('0') && !val.startsWith('0.')) {
            val = val.replace(/^0+/, '');
        }

        setValue(name, Number(val), { shouldValidate: true });
    };

    return (
        <form
            onSubmit={handleSubmit(onSubmit)}
            className="bg-white border-t p-4 space-y-4 cursor-default"
        >
            <h4 className="text-sm font-semibold text-gray-700">Editar producto</h4>

            <div className="space-y-1">
                <Label htmlFor={`name-${product.id}`}>Nombre</Label>
                <Input id={`name-${product.id}`} {...register('name')} />
                {errors.name && (
                    <p className="text-sm text-red-500">{errors.name.message}</p>
                )}
            </div>

            <div>
                <Label htmlFor="stock" className="block text-sm font-medium mb-1">
                    {isTextil ? 'Metros' : 'Stock'}
                </Label>
                <Input
                    id="stock"
                    type="number"
                    inputMode="decimal"
                    step={isTextil ? "0.01" : "1"}
                    {...register("stock", { valueAsNumber: true })}
                    aria-invalid={errors.stock ? 'true' : undefined}
                    min={0}
                    required
                    onWheel={(e) => e.currentTarget.blur()}
                    onChange={handleNormalizedChange('stock')}
                />
                {errors.stock && (
                    <p className="text-xs text-red-600 mt-1">{errors.stock.message}</p>
                )}
            </div>

            <div>
                <Label htmlFor="price" className="block text-sm font-medium mb-1">
                    Precio {isTextil ? '(por metro)' : ''}
                </Label>
                <Input
                    id="price"
                    type="number"
                    inputMode="decimal"
                    step={"0.01"}
                    {...register('price', { valueAsNumber: true })}
                    aria-invalid={errors.price ? 'true' : undefined}
                    min={0}
                    required
                    onWheel={(e) => e.currentTarget.blur()}
                    onChange={handleNormalizedChange('price')}
                />
                {errors.price && (
                    <p className="text-xs text-red-600 mt-1">{errors.price.message}</p>
                )}
            </div>

            <Button type="submit" className="mt-2" disabled={!isValid || isSubmitting}>
                Guardar
            </Button>
        </form>
    );
}