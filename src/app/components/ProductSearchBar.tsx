import React, { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { CameraIcon, Search } from 'lucide-react'
import axios from 'axios'
import { toast } from 'sonner'
import { useOrganizationStore } from '@/store/organizationStore'
import { useProductStore } from '@/store/productStore'
import { getProductSchema } from '@/lib/validations/productSchema'
import FabricIdentifierDialog from './FabricIdentifierDialog'

export function ProductSearchBar({ businessType }: { businessType: string }) {
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [isSearchFabricDialogOpen, setIsSearchFabricDialogOpen] = useState(false)
    const [inputValue, setInputValue] = useState('')

    const isTextil = businessType === 'textil'
    const productSchema = getProductSchema(isTextil)
    type ProductFormData = z.infer<typeof productSchema>
    const { currentOrganization } = useOrganizationStore()
    const { products, pagination, setSearchTerm, fetchProducts } = useProductStore();

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        setInputValue(e.target.value)
    };

    const searchProduct = (search: string) => {
        setSearchTerm(search);
        if (currentOrganization)
            fetchProducts(currentOrganization.id, pagination.page, search)
    };

    useEffect(() => {
        const delayDebounce = setTimeout(() => searchProduct(inputValue), 400);

        return () => clearTimeout(delayDebounce);
    }, [inputValue, currentOrganization, pagination.page, setSearchTerm, fetchProducts]);

    const {
        register,
        handleSubmit,
        setValue,
        formState: { errors, isValid, isSubmitting },
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

    const handleAddProductClick = () => {
        setValue('name', inputValue)
        setValue('stock', 0)
        setValue('price', 0)
        setIsDialogOpen(true)
    }

    const handleSearchFabric = () => {
        setIsDialogOpen(false)
        setIsSearchFabricDialogOpen(true)
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
            setInputValue('')
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
                    value={inputValue}
                    onChange={handleSearch}
                    className="border-none focus-visible:ring-0 focus-visible:ring-offset-0"
                />
                {inputValue.trim() !== '' && !products.find(p => p.name.toLowerCase() === inputValue.toLowerCase()) && (
                    <Button
                        onClick={handleAddProductClick}
                        className="text-xs h-8 px-3 ml-2 transition-colors hover:bg-gray-200"
                        variant="secondary"
                    >
                        Agregar
                    </Button>
                )}
                {inputValue.trim() === '' && currentOrganization.business_type === 'textil' && (
                    <button
                        onClick={handleSearchFabric}
                        className="p-1 border rounded-md transition-colors hover:bg-gray-100"
                        title="Buscar tela"
                        type='button'
                    >
                        <CameraIcon className="min-w-4 h-4 w-4" />
                    </button>
                )}
            </div>

            <FabricIdentifierDialog open={isSearchFabricDialogOpen} onOpenChange={setIsSearchFabricDialogOpen} handleFabricIdentified={searchProduct} />

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Agregar nuevo producto</DialogTitle>
                    </DialogHeader>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium mb-1">
                                Nombre
                                {isTextil && <span className='text-gray-500 mx-1'>
                                    (Recomendamos: [Fibra base] - [Tipo de tejido] - [Color] - [Brillo/textura] - [Patrón])
                                    Por ejemplo:
                                    "Algodón - Jersey - Azul - Mate - Rayado"
                                </span>}
                            </label>
                            <div className="flex items-center border rounded-md overflow-hidden pr-2">
                                <Input
                                    id="name"
                                    {...register('name')}
                                    aria-invalid={errors.name ? 'true' : undefined}
                                    required
                                    className="border-none focus-visible:ring-0 focus-visible:ring-offset-0"

                                />
                                {
                                    currentOrganization.business_type === 'textil' && (
                                        <button
                                            onClick={handleSearchFabric}
                                            className="p-1 border rounded-md transition-colors hover:bg-gray-100"
                                            title="Buscar tela"
                                            type='button'
                                        >
                                            <CameraIcon className="min-w-4 h-4 w-4" />
                                        </button>
                                    )
                                }
                            </div>
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
                            <Button type="submit" disabled={!isValid || isSubmitting}>Guardar</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    )
}
