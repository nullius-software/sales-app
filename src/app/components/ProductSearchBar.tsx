import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'

import { Button } from '@/components/ui/button'
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Search } from 'lucide-react'

const productSchema = z.object({
    name: z.string().min(1, 'El nombre es obligatorio'),
    stock: z
        .number({ invalid_type_error: 'El stock debe ser un número' })
        .min(0, 'El stock no puede ser negativo'),
    price: z
        .number({ invalid_type_error: 'El precio debe ser un número' })
        .min(0, 'El precio no puede ser negativo'),
})

type ProductFormData = z.infer<typeof productSchema>

export function ProductSearchBar({ onSearch }: { onSearch: (e: React.ChangeEvent<HTMLInputElement>) => void }) {
    const [searchTerm, setSearchTerm] = useState('')
    const [isDialogOpen, setIsDialogOpen] = useState(false)

    const {
        register,
        handleSubmit,
        setValue,
        formState: { errors },
        reset,
    } = useForm<ProductFormData>({
        resolver: zodResolver(productSchema),
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

    const onSubmit = (data: ProductFormData) => {
        console.log('Crear producto:', data)
        setIsDialogOpen(false)
        setSearchTerm('')
        reset()
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
                {searchTerm.trim() !== '' && (
                    <Button
                        onClick={handleAddProductClick}
                        className="text-xs h-8 px-3 ml-2 transition-colors hover:bg-muted"
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
                                Stock
                            </label>
                            <Input
                                id="stock"
                                type="number"
                                {...register('stock', { valueAsNumber: true })}
                                aria-invalid={errors.stock ? 'true' : undefined}
                                min={0}
                                required
                            />
                            {errors.stock && (
                                <p className="text-xs text-red-600 mt-1">{errors.stock.message}</p>
                            )}
                        </div>

                        <div>
                            <label htmlFor="price" className="block text-sm font-medium mb-1">
                                Precio
                            </label>
                            <Input
                                id="price"
                                type="number"
                                step="0.01"
                                {...register('price', { valueAsNumber: true })}
                                aria-invalid={errors.price ? 'true' : undefined}
                                min={0}
                                required
                            />
                            {errors.price && (
                                <p className="text-xs text-red-600 mt-1">{errors.price.message}</p>
                            )}
                        </div>

                        <DialogFooter className="flex justify-end space-x-2">
                            <DialogClose asChild>
                                <Button variant="outline">Cancelar</Button>
                            </DialogClose>
                            <Button type="submit">Guardar</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    )
}
