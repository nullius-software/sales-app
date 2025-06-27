'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Building, ChevronDown, History, LogOut, Search } from 'lucide-react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { decodeJWT } from '@/lib/utils';
import { Organization, useOrganizationStore } from '@/store/organizationStore';
import { Separator } from '@/components/ui/separator';
import { NavigationOrganizationItem } from './NavigationOrganizationItem';
import { Input } from '@/components/ui/input';
import { AlertDialog, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogContent, AlertDialogTitle } from '@/components/ui/alert-dialog';
import axios, { AxiosResponse, isAxiosError } from 'axios';
import { OrganizationJoinRequests } from './OrganizationJoinRequests';

interface NavigationProps {
    closeMobileMenu?: () => void;
}

export default function Navigation({ closeMobileMenu }: NavigationProps) {
    const router = useRouter();
    const pathname = usePathname();

    const {
        organizations,
        currentOrganization,
        setOrganizations,
        setCurrentOrganization,
    } = useOrganizationStore();

    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [userName, setUserName] = useState('Admin User');
    const [dropdownOpen, setDropdownOpen] = useState(false)

    const [organizationToDelete, setOrganizationToDelete] = useState<Organization>()

    const [dialogOpen, setDialogOpen] = useState(false);
    const [confirmInput, setConfirmInput] = useState("");

    const fetchOrganizations = useCallback(async () => {
        try {
            const accessToken = localStorage.getItem('access_token');
            const decoded = accessToken ? decodeJWT(accessToken) : null;


            if (!accessToken) {
                router.push('/login');
                return;
            }

            try {
                if (decoded.preferred_username || decoded.name) {
                    setUserName(decoded.preferred_username || decoded.name);
                }
            } catch (e) {
                console.error('Error decoding token:', e);
            }

            const { data } = await axios.get<null, AxiosResponse<Organization[]>>('/api/organizations/joined', {
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                }
            });

            if (data.length > 0) {
                setOrganizations(data);

                if (!currentOrganization) {
                    setCurrentOrganization(data[0]);
                }
            }
        } catch (error) {
            if (isAxiosError(error)) {
                if (error.status === 401) {
                    toast.error('Sesión expirada. Por favor, vuelve a iniciar sesión.');
                    router.push('/login');
                    return;
                }
                toast.error('Error al cargar organizaciones.');
            }
        }
    }, [currentOrganization, router, setUserName, setOrganizations, setCurrentOrganization])

    const handleDelete = async () => {
        if (!organizationToDelete) return
        setDialogOpen(false);
        setConfirmInput("")
        setOrganizations(organizations.filter(org => org.id !== organizationToDelete.id))
        setCurrentOrganization(null)

        try {
            await axios.delete(`/api/organizations/${organizationToDelete.id}`)
        } catch {
            toast.error("Algo salió mal al eliminar la organización")
        } finally {
            setOrganizationToDelete(undefined)
            await fetchOrganizations()
        }
    };

    const isMatch = organizationToDelete && confirmInput.trim() === organizationToDelete.name;



    useEffect(() => {
        fetchOrganizations();
    }, [router, setOrganizations, setCurrentOrganization, fetchOrganizations]);

    const switchOrganization = async (orgId: number) => {
        const org = organizations.find(o => o.id === orgId);
        if (!org) return;

        setCurrentOrganization(org);
        
        if (closeMobileMenu) {
            closeMobileMenu();
        }

        toast(`Cambiado a ${org.name}`);
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
                    client_id: `${process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT_ID}`,
                    client_secret: `${process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT_SECRET}`,
                    refresh_token: refreshToken,
                }),
            });

            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            if (response.ok) {
                toast.success('Successfully logged out');
            }

            setCurrentOrganization(null);
            setOrganizations([]);

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
                        <DropdownMenu open={dropdownOpen} onOpenChange={() => setDropdownOpen(!dropdownOpen)}>
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
                                        <NavigationOrganizationItem
                                            key={org.id}
                                            organization={org}
                                            isCurrent={currentOrganization?.id === org.id}
                                            onSelect={switchOrganization}
                                            onDelete={() => {
                                                setDropdownOpen(false);
                                                setOrganizationToDelete(org);
                                                setDialogOpen(true);
                                            }}
                                        />
                                    ))
                                )}
                                <Separator className='mt-2 mb-1' />
                                <DropdownMenuItem
                                    key={organizations.length}
                                    onClick={() => router.push('/organizations')}
                                >
                                    <Search className="mr-2 h-4 w-4" />
                                    Crear o Buscar
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                        <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
                            <AlertDialogContent className="sm:max-w-[425px]">
                                <AlertDialogHeader>
                                    <AlertDialogTitle>¿Eliminar organización?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Para eliminar la organización, escribí el nombre <strong>{organizationToDelete && organizationToDelete.name}</strong> exacto a continuación.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <Input
                                    placeholder="Nombre exacto de la organización"
                                    value={confirmInput}
                                    onChange={(e) => setConfirmInput(e.target.value)}
                                />

                                <AlertDialogFooter className="pt-2">
                                    <Button variant="outline" onClick={() => setDialogOpen(false)}>
                                        Cancelar
                                    </Button>
                                    <Button
                                        variant="destructive"
                                        onClick={handleDelete}
                                        disabled={!isMatch}
                                    >
                                        Confirmar
                                    </Button>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                </div>
                {
                    currentOrganization &&
                    <OrganizationJoinRequests organizationId={currentOrganization.id} />
                }
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
