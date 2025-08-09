'use client';

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import axios from 'axios';

import { PaginationControls } from '@/components/shared/PaginationControl';

import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { UserPlus, Users, Trash2, ArrowRightLeft } from 'lucide-react';
import { PaginationData } from '@/interfaces/pagination';
import { User } from '@/lib/auth/getCurrentUser';
import { useOrganizationStore } from '@/store/organizationStore';

const ITEMS_PER_PAGE = 3;

const initialPaginationData: PaginationData = {
    page: 1,
    limit: ITEMS_PER_PAGE,
    total: 0,
    totalPages: 0,
}

interface JoinRequest {
    request_id: number
    user_id: number
    email: string
    created_at: string
}

export default function MembersList({ currentUser }: { currentUser: User }) {
    const { currentOrganization, organizations, setCurrentOrganization } = useOrganizationStore();
    const userIsCreator = currentOrganization?.creator === currentUser.id
    const [transferTarget, setTransferTarget] = useState<User | null>(null);
    const [isTransferring, setIsTransferring] = useState(false);

    const [members, setMembers] = useState<User[]>([]);
    const [requests, setRequests] = useState<JoinRequest[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [paginationData, setPaginationData] = useState<PaginationData>(initialPaginationData);

    const fetchData = useCallback(async () => {
        if (!currentOrganization) return;
        try {
            const req = [axios.get(`/api/organizations/${currentOrganization.id}/members`, {
                params: {
                    page: currentPage,
                    limit: ITEMS_PER_PAGE,
                },
            })]
            if (userIsCreator) req.push(axios.get(`/api/organizations/${currentOrganization.id}/requests`))

            const [membersRes, requestsRes] = await Promise.all(req);

            setRequests(requestsRes?.data || []);
            setMembers(membersRes.data.data);
            setPaginationData({
                page: membersRes.data.page,
                limit: membersRes.data.limit,
                total: membersRes.data.total,
                totalPages: membersRes.data.totalPages,
            });
        } catch {
            setMembers([]);
            setRequests([]);
            setPaginationData(initialPaginationData);
        }
    }, [currentOrganization, currentPage, userIsCreator])

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleDeleteMember = async (memberId: string) => {
        try {
            setMembers((prevMembers) =>
                prevMembers.filter((member) => member.id !== memberId)
            );
            setPaginationData((prev) => ({
                ...prev,
                total: prev.total - 1,
                totalPages: Math.ceil((prev.total - 1) / prev.limit),
            }));
            toast.success('Miembro eliminado de la organización.');
            await axios.delete(`/api/organizations/${currentOrganization?.id}/members/${memberId}`);
        } catch {
            toast.error('Error al eliminar al miembro.');
        } finally {
            fetchData()
        }
    };

    const handleQuitOrganization = async (memberId: string) => {
        try {
            setMembers((prevMembers) =>
                prevMembers.filter((member) => member.id !== memberId)
            );
            setPaginationData((prev) => ({
                ...prev,
                total: prev.total - 1,
                totalPages: Math.ceil((prev.total - 1) / prev.limit),
            }));
            setCurrentOrganization(organizations.find(org => org.id != currentOrganization?.id) || null)
            toast.success('Ya no sos miembro de la organización.');
            await axios.delete(`/api/organizations/${currentOrganization?.id}/members/${memberId}`);
        } catch {
            toast.error('Error al salir de la organización.');
        } finally {
            fetchData()
        }
    };

    const handlePageChange = (newPage: number) => {
        if (newPage > 0 && newPage <= paginationData.totalPages) {
            setCurrentPage(newPage);
        }
    };

    const handleAction = async (requestId: number, action: 'approved' | 'rejected') => {
        try {
            setRequests((prev) => prev.filter((r) => r.request_id !== requestId))
            toast.success(`Solicitud ${action === 'approved' ? 'aprobada' : 'rechazada'}`)
            if (action === 'approved') {
                await axios.patch(`/api/organizations/requests/${requestId}`)
            } else {
                await axios.delete(`/api/organizations/requests/${requestId}`)
            }
        } catch {
            toast.error('Error al procesar la solicitud')
        } finally {
            fetchData()
        }
    }

    return (
        <Card className='w-full h-full'>
            <CardHeader>
                <CardTitle className="flex items-center">
                    <Users className="mr-2 h-5 w-5" />
                    Miembros {userIsCreator && 'y peticiones de ingreso'}
                </CardTitle>
            </CardHeader>
            <CardContent>
                <ul className="space-y-4">
                    {userIsCreator && requests.map((request) => (
                        <li
                            key={request.request_id}
                            className="flex items-center justify-between w-full"
                        >
                            <div className="flex items-center space-x-4 shrink">
                                <Avatar>
                                    <AvatarFallback>
                                        <UserPlus className="h-5 w-5" />
                                    </AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="font-semibold break-all">{request.email}</p>
                                    <p className="text-sm text-muted-foreground">
                                        Petición pendiente •{' '}
                                        {new Date(request.created_at).toLocaleDateString(
                                            'es-AR',
                                            {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric',
                                            }
                                        )}
                                    </p>
                                </div>
                            </div>
                            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 ml-2 sm:*:flex-1">
                                <Button
                                    variant="default"
                                    size="sm"
                                    className="w-full"
                                    onClick={() => handleAction(request.request_id, 'approved')}>
                                    Aceptar
                                </Button>
                                <Button
                                    variant="destructive"
                                    size="sm"
                                    className="w-full"
                                    onClick={() => handleAction(request.request_id, 'rejected')}>
                                    Rechazar
                                </Button>
                            </div>
                        </li>
                    ))}
                    {members.map((member) => (
                        <li
                            key={member.id}
                            className={`flex items-center justify-between ${member.id === currentUser.id && 'order-1'}`}
                        >
                            <div className="flex items-center space-x-4">
                                <Avatar>
                                    <AvatarFallback>
                                        {member.email.charAt(0).toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="text-sm text-muted-foreground break-all">
                                        {member.email}
                                    </p>
                                </div>
                            </div>
                            {userIsCreator && (
                                <div className='flex gap-2 flex-wrap pl-1'>
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                aria-label="Transferir organización"
                                                onClick={() => setTransferTarget(member)}
                                            >
                                                <ArrowRightLeft className="h-4 w-4" />
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>¿Transferir organización?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    Esta acción transferirá la propiedad de la organización a {member.email}. Luego de eso ya no podrás realizar acciones administrativas como eliminar miembros.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel onClick={() => setTransferTarget(null)}>
                                                    Cancelar
                                                </AlertDialogCancel>
                                                <AlertDialogAction
                                                    onClick={async () => {
                                                        if (!currentOrganization || !transferTarget) return;
                                                        setIsTransferring(true);
                                                        try {
                                                            await axios.patch(`/api/organizations/${currentOrganization.id}/transfer`, {
                                                                newOwnerId: transferTarget.id
                                                            });
                                                            toast.success(`La organización fue transferida a ${transferTarget.email}`);
                                                            setCurrentOrganization({
                                                                ...currentOrganization,
                                                                creator: transferTarget.id
                                                            })
                                                            setCurrentPage(1)
                                                            setTransferTarget(null);
                                                        } catch {
                                                            toast.error('Error al transferir la organización');
                                                        } finally {
                                                            setIsTransferring(false);
                                                        }
                                                    }}
                                                    disabled={isTransferring}
                                                >
                                                    {isTransferring ? 'Transfiriendo...' : 'Transferir'}
                                                </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                aria-label="Eliminar miembro"
                                            >
                                                <Trash2 className="h-4 w-4 text-destructive" />
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    Esta acción eliminará permanentemente al miembro de
                                                    la organización. Esto no se puede deshacer.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                <AlertDialogAction
                                                    onClick={() => handleDeleteMember(member.id)}
                                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                                >
                                                    Continuar
                                                </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </div>
                            )}
                            {currentUser.id === member.id && (
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            aria-label="Salir de la organización"
                                        >
                                            <Trash2 className="h-4 w-4 text-destructive" />
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                Esta acción te eliminará permanentemente de la
                                                organización. Tendrás que volver a solicitar entrar.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                            <AlertDialogAction
                                                onClick={() => handleQuitOrganization(member.id)}
                                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                            >
                                                Continuar
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            )}
                        </li>
                    ))}
                </ul>
                {members.length === 0 && requests.length === 0 && (
                    <p>No hay miembros ni peticiones de ingreso. <br />{userIsCreator && 'Cuando tus empleados soliciten entrar a tu organización lo verás aquí.'}</p>
                )}
            </CardContent>
            <PaginationControls
                className='mt-auto'
                pagination={paginationData}
                onPageChange={handlePageChange}
            />
        </Card>
    )
}