'use client'

import { useHeaderMenuStore } from "@/store/headerMenuStore";
import {
    Building,
    History,
    LayoutDashboard
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function NavigationLinks() {
    const pathname = usePathname()
    const { setSidebarOpen } = useHeaderMenuStore()

    return (
        <div className="space-y-1">
            <Link
                href="/"
                onClick={() => setSidebarOpen(false)}
                className={`w-full text-left px-4 py-2 rounded-md flex items-center ${pathname === '/' || pathname === '' ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-gray-100'}`}
            >
                <Building className="mr-2 h-4 w-4" />
                Vender
            </Link>
            <Link
                href="/history"
                onClick={() => setSidebarOpen(false)}
                className={`w-full text-left px-4 py-2 rounded-md flex items-center ${pathname === '/history' ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-gray-100'}`}
            >
                <History className="mr-2 h-4 w-4" />
                Historial de Ventas
            </Link>
            <Link
                href="/dashboard"
                onClick={() => setSidebarOpen(false)}
                className={`w-full text-left px-4 py-2 rounded-md flex items-center ${pathname === '/dashboard' ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-gray-100'}`}
            >
                <LayoutDashboard className="mr-2 h-4 w-4" />
                Panel
            </Link>
            <Link
                href="/chat"
                onClick={() => setSidebarOpen(false)}
                className={`w-full text-left px-4 py-2 rounded-md flex items-center ${pathname === '/chat' ? 'bg-primary/10 text-primary' : 'hover:bg-gray-100'}`}
            >
                <svg
                    className="mr-2 h-4 w-4"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2v2m0 16v2m8-10h2M2 12H4m15.36-6.36l1.42 1.42M5.22 17.78l1.42 1.42M17.78 18.78l-1.42-1.42M6.64 5.64L5.22 4.22M12 6a6 6 0 100 12 6 6 0 000-12z" />
                </svg>
                Chat Assistant
            </Link>
        </div>
    )
}