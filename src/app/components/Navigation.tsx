'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Building, ChevronDown, History, LogOut } from 'lucide-react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { decodeJWT } from '@/lib/utils';

type Organization = {
    id: number;
    name: string;
};

interface NavigationProps {
    currentOrganization: Organization | null;
    setCurrentOrganization: (org: Organization) => void;
    closeMobileMenu?: () => void;
}

export default function Navigation({
    currentOrganization,
    setCurrentOrganization,
    closeMobileMenu
}: NavigationProps) {
    const router = useRouter();
    const pathname = usePathname();
    const [organizations, setOrganizations] = useState<Organization[]>([]);
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [userName, setUserName] = useState('Admin User');

    useEffect(() => {
        const fetchOrganizations = async () => {
            try {
                const accessToken = localStorage.getItem('access_token');
                
                if (!accessToken) {
                    router.push('/login');
                    return;
                }
                
                try {
                    const decoded = decodeJWT(accessToken);
                    if (decoded.preferred_username || decoded.name) {
                        setUserName(decoded.preferred_username || decoded.name);
                    }
                } catch (e) {
                    console.error('Error decoding token:', e);
                }
                
                const response = await fetch('/api/organizations', {
                    headers: {
                        'Authorization': `Bearer ${accessToken}`
                    }
                });
                
                if (!response.ok) {
                    if (response.status === 401) {
                        toast.error('Session expired. Please log in again.');
                        router.push('/login');
                        return;
                    }
                    throw new Error('Failed to fetch organizations');
                }
                
                const data = await response.json();
                
                if (data.length > 0) {
                    setOrganizations(data);
                    
                    // Setting the first organization as the default one
                    if (!currentOrganization) {
                        setCurrentOrganization(data[0]);
                    }
                } else {
                    toast.warning('No organizations available');
                }
            } catch (error) {
                console.error('Failed to fetch organizations:', error);
                toast.error('Failed to load organizations');
            }
        };

        fetchOrganizations();
    }, [router, setCurrentOrganization, currentOrganization]);

    const switchOrganization = async (orgId: number) => {
        const org = organizations.find(o => o.id === orgId);
        if (!org) return;

        setCurrentOrganization(org);
        if (closeMobileMenu) {
            closeMobileMenu();
        }

        toast.success(`Cambiado a ${org.name}`);
    };

    const handleLogout = async () => {
        try {
            setIsLoggingOut(true);

            const refreshToken = localStorage.getItem('refresh_token');

            if (!refreshToken) {
                localStorage.removeItem('access_token');
                localStorage.removeItem('refresh_token');
                router.push('/login');
                return;
            }

            const response = await fetch('/auth/realms/nullius-realm/protocol/openid-connect/logout', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    client_id: 'auth-service-client',
                    client_secret: 'UPIdbaD9HmzHblyBKiIm5DqdrIzXDlSZ',
                    refresh_token: refreshToken,
                }),
            });

            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            if (response.ok) {
                toast.success('Successfully logged out');
            }

            router.push('/login');
        } catch (error) {
            toast.error('Error logging out');
            console.error('Logout error:', error);
        } finally {
            setIsLoggingOut(false);
        }
    };

    return (
        <div className="flex flex-col h-full py-6 px-2">
            <div className="px-4 mb-6">
                <p className="text-sm text-gray-500">Sesión iniciada como</p>
                <p className="font-medium">{userName}</p>
            </div>
    
            <div className="flex-grow flex flex-col justify-center">
                <div className="mb-12">
                    <h2 className="text-lg font-semibold px-4 mb-2">Organizaciones</h2>
                    <div className="px-4">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" className="flex items-center w-full justify-between">
                                    <div className="flex items-center truncate mr-2">
                                        <Building className="min-w-4 h-4 w-4 mr-2" />
                                        <span className="truncate">
                                            {currentOrganization?.name || 'Seleccionar organización'}
                                        </span>
                                    </div>
                                    <ChevronDown className="h-4 w-4 flex-shrink-0" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start" className="w-56">
                                {organizations.length === 0 ? (
                                    <DropdownMenuItem disabled>
                                        No hay organizaciones disponibles
                                    </DropdownMenuItem>
                                ) : (
                                    organizations.map(org => (
                                        <DropdownMenuItem
                                            key={org.id}
                                            onClick={() => switchOrganization(org.id)}
                                            className={currentOrganization && org.id === currentOrganization.id ? 'bg-primary/10 text-primary font-medium' : ''}
                                        >
                                            <Building className="mr-2 h-4 w-4" />
                                            {org.name}
                                        </DropdownMenuItem>
                                    ))
                                )}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
                <div className="mb-12">
                    <h2 className="text-lg font-semibold px-4 mb-2">Navegación</h2>
                    <div className="space-y-1">
                        <Link
                            href="/"
                            className={`w-full text-left px-4 py-2 rounded-md flex items-center ${pathname === '/' || pathname === '' ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-gray-100'}`}
                        >
                            <Building className="mr-2 h-4 w-4" />
                            Vender
                        </Link>
                        <Link
                            href="/history"
                            className={`w-full text-left px-4 py-2 rounded-md flex items-center ${pathname === '/history' ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-gray-100'}`}
                        >
                            <History className="mr-2 h-4 w-4" />
                            Historial de Ventas
                        </Link>
                    </div>
                </div>
            </div>
    
            <div className="mt-auto px-4">
                <Button
                    variant="outline"
                    className="w-full flex items-center justify-center text-red-500 hover:text-red-600 hover:bg-red-50"
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                >
                    <LogOut className="mr-2 h-4 w-4" />
                    {isLoggingOut ? 'Cerrando sesión...' : 'Cerrar sesión'}
                </Button>
            </div>
        </div>
    );
}