'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import axios from 'axios';

import { PaginationControls } from '@/app/components/PaginationControl';

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
import { UserPlus, Users, Trash2 } from 'lucide-react';
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
    const { currentOrganization } = useOrganizationStore();
    const userIsCreator = currentOrganization?.creator === currentUser.id

    const [members, setMembers] = useState<User[]>([]);
    const [requests, setRequests] = useState<JoinRequest[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [paginationData, setPaginationData] = useState<PaginationData>(initialPaginationData);

    useEffect(() => {
        const fetchData = async () => {
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
        };

        fetchData();
    }, [currentOrganization, currentPage]);

    const handleDeleteMember = async (memberId: string) => {
        try {
            await axios.delete(`/api/organizations/${currentOrganization?.id}/members/${memberId}`);
            toast.success('Miembro eliminado de la organización.');
            setMembers((prevMembers) =>
                prevMembers.filter((member) => member.id !== memberId)
            );
            setPaginationData((prev) => ({
                ...prev,
                total: prev.total - 1,
                totalPages: Math.ceil((prev.total - 1) / prev.limit),
            }));
        } catch {
            toast.error('Error al eliminar al miembro.');
        }
    };

    const handlePageChange = (newPage: number) => {
        if (newPage > 0 && newPage <= paginationData.totalPages) {
            setCurrentPage(newPage);
        }
    };

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
                                <Button variant="default" size="sm" className="w-full">
                                    Aceptar
                                </Button>
                                <Button variant="destructive" size="sm" className="w-full">
                                    Rechazar
                                </Button>
                            </div>
                        </li>
                    ))}
                    {members.map((member) => (
                        <li
                            key={member.id}
                            className="flex items-center justify-between"
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