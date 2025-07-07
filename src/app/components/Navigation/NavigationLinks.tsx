"use client";

import { useHeaderMenuStore } from "@/store/headerMenuStore";
import { Building, History } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function NavigationLinks() {
  const pathname = usePathname();
  const { setSidebarOpen } = useHeaderMenuStore();

  return (
    <div className="space-y-1">
      <Link
        href="/"
        onClick={() => setSidebarOpen(false)}
        className={`w-full text-left px-4 py-2 rounded-md flex items-center ${pathname === "/" || pathname === "" ? "bg-primary/10 text-primary font-medium" : "hover:bg-gray-100"}`}
      >
        <Building className="mr-2 h-4 w-4" />
        Vender
      </Link>
      <Link
        href="/history"
        onClick={() => setSidebarOpen(false)}
        className={`w-full text-left px-4 py-2 rounded-md flex items-center ${pathname === "/history" ? "bg-primary/10 text-primary font-medium" : "hover:bg-gray-100"}`}
      >
        <History className="mr-2 h-4 w-4" />
        Historial de Ventas
      </Link>
    </div>
  );
}
