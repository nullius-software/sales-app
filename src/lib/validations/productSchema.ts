import { z } from "zod";

export const getProductSchema = (stockDecimal: boolean) =>
  z.object({
    name: z.string().min(1, "El nombre es obligatorio"),
    stock: z
      .number({
        required_error: "El stock es obligatorio",
        invalid_type_error: "El stock debe ser un número válido",
      })
      .refine((val) => !isNaN(val), "El stock debe ser un número válido")
      .refine((val) => val >= 0, "El stock no puede ser negativo")
      .refine(
        (val) =>
          stockDecimal
            ? /^\d+(\.\d{1,2})?$/.test(val.toString())
            : Number.isInteger(val),
        stockDecimal
          ? "El stock debe tener hasta 2 decimales"
          : "El stock debe ser entero",
      ),

    price: z
      .number({
        required_error: "El precio es obligatorio",
        invalid_type_error: "El precio debe ser un número válido",
      })
      .refine((val) => !isNaN(val), "El precio debe ser un número válido")
      .refine((val) => val >= 0, "El precio no puede ser negativo")
      .refine(
        (val) => /^\d+(\.\d{1,2})?$/.test(val.toString()),
        "El precio debe tener hasta 2 decimales",
      ),
    unit: z.enum(["unit", "meter", "kilogram"], {
      required_error: "La unidad es obligatoria",
      invalid_type_error: "Unidad inválida",
    }),
  });
