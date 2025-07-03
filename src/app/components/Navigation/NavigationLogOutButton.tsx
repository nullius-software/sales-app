'use client';

import { Button } from "@/components/ui/button";
import { logout } from "@/lib/auth/logout";
import { useOrganizationStore } from "@/store/organizationStore";
import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

export default function NavigationLogOutButton() {
    const router = useRouter();
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    const {
        setOrganizations,
        setCurrentOrganization,
    } = useOrganizationStore();

    const handleLogout = async () => {
        try {
            setIsLoggingOut(true);

            await logout();
            toast.success('Sesión cerrada correctamente.');

            setCurrentOrganization(null);
            setOrganizations([]);

            router.push('/login');
        } catch (error) {
            toast.error('Error al cerrar sesión.');
            console.error('Logout error:', error);
        } finally {
            setIsLoggingOut(false);
        }
    };
    return <Button
        variant="outline"
        className="w-full flex items-center justify-center text-red-500 hover:text-red-600 hover:bg-red-50"
        onClick={handleLogout}
        disabled={isLoggingOut}
    >
        <LogOut className="mr-2 h-4 w-4" />
        {isLoggingOut ? 'Cerrando sesión...' : 'Cerrar sesión'}
    </Button>
}