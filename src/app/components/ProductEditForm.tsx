"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Product, ProductUnit } from "@/interfaces/product";
import { z } from "zod";
import { getProductSchema } from "@/lib/validations/productSchema";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import axios, { AxiosError } from "axios";
import { toast } from "sonner";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScanBarcodeIcon } from "lucide-react";
import BarcodeScanner from "./BarcodeScanner";
import { Organization } from "@/store/organizationStore";
import { useProductStore } from "@/store/productStore";

interface ProductEditFormProps {
  organization: Organization;
  product: Product;
  onEditProduct: () => void;
  onDeleteProduct: () => void;
}

export default function ProductEditForm({
  organization,
  product,
  onEditProduct,
  onDeleteProduct,
}: ProductEditFormProps) {
  const [openDialog, setOpenDialog] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [unit, setUnit] = useState(product.unit);

  const { fetchProducts, pagination } = useProductStore();

  const productSchema = getProductSchema(["meter", "kilogram"].includes(unit));
  type ProductFormData = z.infer<typeof productSchema>;

  const {
    register,
    handleSubmit,
    formState: { errors, isValid, isSubmitting },
    setValue,
  } = useForm<ProductFormData>({
    mode: "onChange",
    reValidateMode: "onChange",
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: product.name,
      price: product.price,
      stock: product.stock,
      unit: product.unit,
    },
  });

  const onSubmit = async (data: ProductFormData) => {
    try {
      await axios.put(`/api/products/${product.id}`, data);
      toast.success("Producto actualizado correctamente");
      onEditProduct();
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        const msg = error.response?.data?.error || "Error desconocido";

        if (status === 400 && error.response?.data?.issues) {
          toast.error("Error de validación. Revisa los campos.");
          console.error("Zod issues:", error.response.data.issues);
        } else if (status === 404) {
          toast.error("Producto no encontrado.");
        } else {
          toast.error(msg);
        }
      } else {
        toast.error("Error inesperado al actualizar el producto.");
        console.error(error);
      }
    }
  };

  const handleNormalizedChange =
    (name: "stock" | "price") => (e: React.ChangeEvent<HTMLInputElement>) => {
      let val = e.target.value;

      if (val === "") {
        setValue(name, 0, { shouldValidate: true });
        return;
      }

      if (val.length > 1 && val.startsWith("0") && !val.startsWith("0.")) {
        val = val.replace(/^0+/, "");
      }

      setValue(name, Number(val), { shouldValidate: true });
    };

  const handleUnitChange = (unit: ProductUnit) => {
    setUnit(unit);
    setValue("unit", unit);
    setValue("stock", unit === product.unit ? product.stock : 0);
  };

  const handleBarcodeScan = async (barcode: string) => {
    setIsScannerOpen(false);

    try {
      await axios.put(`/api/products/${product.id}/barcode`, { barcode });
      await fetchProducts(organization.id, pagination.page);
      toast.success("Código de barra agregado");
    } catch (error) {
      if (error instanceof AxiosError && error.response?.status === 409) {
        toast.error(error.response.data.error);
      } else {
        toast.error(
          "Error al actualizar el código de barra. Inténtalo de nuevo más tarde.",
        );
      }
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="bg-white border-t p-4 space-y-4 cursor-default"
    >
      <h4 className="text-sm font-semibold text-gray-700">Editar producto</h4>

      <div className="space-y-1">
        <Label htmlFor={`name-${product.id}`}>Nombre</Label>
        <Input id={`name-${product.id}`} {...register("name")} />
        {errors.name && (
          <p className="text-sm text-red-500">{errors.name.message}</p>
        )}
      </div>

      <div>
        <div className="mb-2">
          <Label htmlFor="stock" className="mb-1">
            Stock
          </Label>
          <Select value={unit} onValueChange={handleUnitChange}>
            <SelectTrigger className="w-full bg-white border-gray-300">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="unit">Unidades</SelectItem>
              <SelectItem value="meter">Metros</SelectItem>
              <SelectItem value="kilogram">Kilogramos</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Input
          id="stock"
          type="number"
          inputMode={
            unit === "meter" || unit === "kilogram" ? "decimal" : "numeric"
          }
          step={unit === "meter" || unit === "kilogram" ? "0.01" : "1"}
          {...register("stock", { valueAsNumber: true })}
          aria-invalid={errors.stock ? "true" : undefined}
          min={0}
          required
          onWheel={(e) => e.currentTarget.blur()}
          onBlur={handleNormalizedChange("stock")}
        />
        {errors.stock && (
          <p className="text-xs text-red-600 mt-1">{errors.stock.message}</p>
        )}
      </div>

      <div>
        <Label htmlFor="price" className="block text-sm font-medium mb-1">
          Precio (por{" "}
          {unit === "meter"
            ? "metro"
            : unit === "unit"
              ? "unidad"
              : "kilogramo"}
          )
        </Label>
        <Input
          id="price"
          type="number"
          inputMode="decimal"
          step={"0.01"}
          {...register("price", { valueAsNumber: true })}
          aria-invalid={errors.price ? "true" : undefined}
          min={0}
          required
          onWheel={(e) => e.currentTarget.blur()}
          onBlur={handleNormalizedChange("price")}
        />
        {errors.price && (
          <p className="text-xs text-red-600 mt-1">{errors.price.message}</p>
        )}
      </div>
      {product.barcode && (
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium mb-1">
            ¿Queres reescanear el código de barras?
          </p>
          <Button
            type="button"
            className="border rounded-md text-gray-600 hover:bg-gray-200"
            variant={"outline"}
            onClick={() => setIsScannerOpen(true)}
          >
            <ScanBarcodeIcon className="min-w-4 h-4 w-4 m-0" />
          </Button>
        </div>
      )}

      <Button
        type="submit"
        className="mt-2"
        disabled={!isValid || isSubmitting}
      >
        Guardar
      </Button>
      <Button
        type="button"
        className="mx-2"
        variant="destructive"
        disabled={isSubmitting}
        onClick={() => setOpenDialog(true)}
      >
        Eliminar
      </Button>

      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar producto</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            ¿Estás seguro que deseas eliminar permanentemente este producto?
            Esta acción no se puede deshacer.
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenDialog(false)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                onDeleteProduct();
                setOpenDialog(false);
              }}
            >
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isScannerOpen} onOpenChange={setIsScannerOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Escanear Código de Barras</DialogTitle>
            <DialogDescription>
              Apunte la cámara al código de barras del producto &quot;
              {product.name}&quot;.
            </DialogDescription>
          </DialogHeader>
          {isScannerOpen && <BarcodeScanner onScan={handleBarcodeScan} />}
        </DialogContent>
      </Dialog>
    </form>
  );
}
