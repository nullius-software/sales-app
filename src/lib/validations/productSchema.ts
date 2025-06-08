import { z } from 'zod'

export const getProductSchema = (isTextil: boolean) => z.object({
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