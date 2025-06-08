import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Search } from 'lucide-react'
import axios from 'axios'
import { toast } from 'sonner'
import { useOrganizationStore } from '@/store/organizationStore'
import { useProductStore } from '@/store/productStore'

const getProductSchema = (isTextil: boolean) => z.object({
    name: z.string().min(1, 'El nombre es obligatorio'),
    stock: z.number({
        required_error: 'El stock es obligatorio',
        invalid_type_error: 'El stock debe ser un número válido',
    }).refine((val) => !isNaN(val), 'El stock debe ser un número válido')
        .refine((val) => val >= 0, 'El stock no puede ser negativo')
        .refine((val) => isTextil ? /^\d+(\.\d{1,2})?$/.test(val.toString()) : Number.isInteger(val), isTextil ? 'El stock debe tener hasta 2 decimales' : 'El stock debe ser entero'),

    price: z.number({
        required_error: 'El precio es obligatorio',
        invalid_type_error: 'El precio debe ser un número válido',
    }).refine((val) => !isNaN(val), 'El precio debe ser un número válido')
        .refine((val) => val >= 0, 'El precio no puede ser negativo')
        .refine((val) => /^\d+(\.\d{1,2})?$/.test(val.toString()), 'El precio debe tener hasta 2 decimales'),
})

export function ProductSearchBar({ businessType, onSearch }: { businessType: string, onSearch: (e: React.ChangeEvent<HTMLInputElement>) => void }) {
    const [searchTerm, setSearchTerm] = useState('')
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const isTextil = businessType === 'textil'
    const productSchema = getProductSchema(isTextil)
    type ProductFormData = z.infer<typeof productSchema>
    const { currentOrganization } = useOrganizationStore()
    const { products } = useProductStore()

    const {
        register,
        handleSubmit,
        setValue,
        formState: { errors, isValid },
        reset,
    } = useForm<ProductFormData>({
        resolver: zodResolver(productSchema),
        mode: 'onChange',
        reValidateMode: 'onChange',
        defaultValues: {
            name: '',
            stock: 0,
            price: 0,
        },
    })

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value)
        onSearch(e)
    }

    const handleAddProductClick = () => {
        setValue('name', searchTerm)
        setValue('stock', 0)
        setValue('price', 0)
        setIsDialogOpen(true)
    }

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

    if (!currentOrganization) return

    const onSubmit = async (data: ProductFormData) => {
        try {
            await axios.post('/api/products', { ...data, organization_id: currentOrganization.id })

            toast.success('Producto creado correctamente')

            setIsDialogOpen(false)
            setSearchTerm('')
            reset()
        } catch (error: any) {
            const errorMessage =
                error.response?.data?.message || 'Ocurrió un error al crear el producto.'

            toast.error(errorMessage)
        }
    }

    return (
        <div className="relative">
            <Search
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                size={18}
            />
            <div className="flex items-center border rounded-md overflow-hidden pl-10 pr-2">
                <Input
                    placeholder="Buscar productos..."
                    value={searchTerm}
                    onChange={handleSearch}
                    className="border-none focus-visible:ring-0 focus-visible:ring-offset-0"
                />
                {searchTerm.trim() !== '' && !products.find(p => p.name.toLowerCase() === searchTerm) && (
                    <Button
                        onClick={handleAddProductClick}
                        className="text-xs h-8 px-3 ml-2 transition-colors hover:bg-gray-200"
                        variant="secondary"
                    >
                        Agregar
                    </Button>
                )}
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Agregar nuevo producto</DialogTitle>
                    </DialogHeader>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium mb-1">
                                Nombre
                            </label>
                            <Input
                                id="name"
                                {...register('name')}
                                aria-invalid={errors.name ? 'true' : undefined}
                                required
                            />
                            {errors.name && (
                                <p className="text-xs text-red-600 mt-1">{errors.name.message}</p>
                            )}
                        </div>

                        <div>
                            <label htmlFor="stock" className="block text-sm font-medium mb-1">
                                {isTextil ? 'Metros' : 'Stock'}
                            </label>
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
                            <label htmlFor="price" className="block text-sm font-medium mb-1">
                                Precio {isTextil ? '(por metro)' : ''}
                            </label>
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

                        <DialogFooter className="flex justify-end space-x-2">
                            <DialogClose asChild>
                                <Button variant="outline">Cancelar</Button>
                            </DialogClose>
                            <Button type="submit" disabled={!isValid}>Guardar</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    )
}
