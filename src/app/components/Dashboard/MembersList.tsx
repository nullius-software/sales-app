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
import { JoinRequest } from '@/app/components/Navigation/OrganizationJoinRequests';
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

export default function MembersList() {
    const orgId = useOrganizationStore().currentOrganization?.id;

    const [members, setMembers] = useState<User[]>([]);
    const [requests, setRequests] = useState<JoinRequest[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [paginationData, setPaginationData] = useState<PaginationData>(initialPaginationData);

    useEffect(() => {
        if (!orgId) return;

        const fetchData = async () => {
            try {
                const [membersRes, requestsRes] = await Promise.all([
                    axios.get(`/api/organizations/${orgId}/members`, {
                        params: {
                            page: currentPage,
                            limit: ITEMS_PER_PAGE,
                        },
                    }),
                    axios.get(`/api/organizations/${orgId}/requests`),
                ]);

                setMembers(membersRes.data.data);
                setPaginationData({
                    page: membersRes.data.page,
                    limit: membersRes.data.limit,
                    total: membersRes.data.total,
                    totalPages: membersRes.data.totalPages,
                });
                setRequests(requestsRes.data);
            } catch {
                setMembers([]);
                setRequests([]);
                setPaginationData(initialPaginationData);
            }
        };

        fetchData();
    }, [orgId, currentPage]);

    const handleDeleteMember = async (memberId: string) => {
        try {
            await axios.delete(`/api/organizations/${orgId}/members/${memberId}`);
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

    if (members.length === 0 && requests.length === 0) return null

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center">
                    <Users className="mr-2 h-5 w-5" />
                    Miembros y peticiones de ingreso
                </CardTitle>
            </CardHeader>
            <CardContent>
                <ul className="space-y-4">
                    {requests.map((request) => (
                        <li
                            key={request.request_id}
                            className="flex items-center justify-between"
                        >
                            <div className="flex items-center space-x-4">
                                <Avatar>
                                    <AvatarFallback>
                                        <UserPlus className="h-5 w-5" />
                                    </AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="font-semibold">{request.email}</p>
                                    <p className="text-sm text-muted-foreground">
                                        Petición pendiente •{' '}
                                        {new Date(request.created_at).toLocaleDateString(
                                            'es-ES',
                                            {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric',
                                            }
                                        )}
                                    </p>
                                </div>
                            </div>
                            <div className="flex space-x-2">
                                <Button variant="default" size="sm">
                                    Aceptar
                                </Button>
                                <Button variant="destructive" size="sm">
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
                                    <p className="text-sm text-muted-foreground">
                                        {member.email}
                                    </p>
                                </div>
                            </div>
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
                        </li>
                    ))}
                </ul>
            </CardContent>
            <PaginationControls
                pagination={paginationData}
                onPageChange={handlePageChange}
            />
        </Card>
    )
}