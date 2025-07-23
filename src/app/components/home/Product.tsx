import { Fragment, useState } from "react";
import { type Product as ProductType } from "@/interfaces/product";
import { useSelectedProductsStore } from "@/store/selectedProductsStore";
import { toast } from "sonner";
import { ChevronDown, ChevronUp, ScanBarcodeIcon } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import ProductEditForm from "./ProductEditForm";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import BarcodeScanner from "../BarcodeScanner";
import axios, { AxiosError } from "axios";
import { useProductStore } from "@/store/productStore";
import { useOrganizationStore } from "@/store/organizationStore";

export default function Product({ product }: { product: ProductType }) {
  const { currentOrganization } = useOrganizationStore();
  const { addSelectedProduct } = useSelectedProductsStore();
  const { fetchProducts } = useProductStore();
  const isMobile = useMediaQuery("(max-width: 768px)");
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [hoveredProductId, setHoveredProductId] = useState<string | null>(null);
  const [expandedProductId, setExpandedProductId] = useState<string | null>(
    null
  );

  if (!currentOrganization) return null;

  const isSellable = product.stock > 0 && product.price > 0;
  let disabledReason = "";

  if (product.stock <= 0) {
    disabledReason = "Sin stock disponible";
  } else if (product.price <= 0) {
    disabledReason = "Producto sin precio";
  }

  const handleSelectProduct = (product: ProductType) => {
    if (product.stock <= 0) {
      toast.error(`No hay stock disponible para ${product.name}`);
      return;
    }

    addSelectedProduct(product);
  };

  const handleBarcodeScan = async (barcode: string) => {
    setIsScannerOpen(false);

    try {
      await axios.put(`/api/products/${product.id}/barcode`, { barcode });
      await fetchProducts(currentOrganization.id);
      toast.success("Código de barra agregado");
    } catch (error) {
      if (error instanceof AxiosError && error.response?.status === 409) {
        toast.error(error.response.data.error);
      } else {
        toast.error(
          "Error al actualizar el código de barra. Inténtalo de nuevo más tarde."
        );
      }
    }
  };

  return (
    <div
      key={product.id}
      onMouseEnter={() => setHoveredProductId(product.id)}
      onMouseLeave={() => setHoveredProductId(null)}
      className={`flex flex-col border rounded-md overflow-hidden transition ${
        hoveredProductId === product.id
          ? "bg-gray-50 cursor-pointer"
          : "cursor-pointer"
      }`}
    >
      <div
        className={`flex justify-between items-center p-3 transition ${
          !isSellable && "opacity-50 cursor-not-allowed"
        }`}
        onClick={() => {
          if (isSellable) {
            handleSelectProduct(product);
            setExpandedProductId(null);
          }
        }}
        title={disabledReason}
      >
        <div>
          <p className="font-medium">{product.name}</p>
          <p className="text-sm text-gray-500">
            {product.price > 0 ? (
              `$${product.price}`
            ) : (
              <span className="text-red-500">Sin precio</span>
            )}
          </p>
        </div>
        <div className="text-right flex items-center space-x-2">
          <p className="text-sm text-gray-500">
            {product.unit === "meter"
              ? `Mts: ${product.stock}`
              : product.unit === "unit"
              ? `Stock: ${product.stock}`
              : `Kg: ${product.stock}`}
          </p>
          {!product.barcode && (
            <button
              onClick={(e) => { e.stopPropagation(); setIsScannerOpen(true)}}
              className="p-1 border rounded-md text-gray-600 hover:bg-gray-200"
              title="Escanear código de barras"
            >
              <ScanBarcodeIcon className="min-w-4 h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {(isMobile ||
        hoveredProductId === product.id ||
        expandedProductId === product.id) && (
        <Fragment>
          <Separator />
          <button
            onClick={(e) => {
              e.stopPropagation();
              setExpandedProductId((prev) =>
                prev === product.id ? null : product.id
              );
            }}
            className="px-3 py-2 w-full flex items-center justify-center text-sm text-gray-500 hover:text-black transition"
          >
            {expandedProductId === product.id ? (
              <ChevronUp height={18} />
            ) : (
              <ChevronDown height={18} />
            )}
          </button>
        </Fragment>
      )}

      {expandedProductId === product.id && (
        <ProductEditForm
          product={product}
          onClose={() => setExpandedProductId(null)}
          onScan={handleBarcodeScan}
        />
      )}
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
    </div>
  );
}
