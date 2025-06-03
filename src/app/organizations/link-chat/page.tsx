'use client'

import { Suspense, useEffect, useState } from "react"
import axios, { AxiosResponse } from "axios"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle } from "@/components/ui/card"

import { useOrganizationStore } from "@/store/organizationStore"
import { useUserStore } from "@/store/userStore"
import { useMediaQuery } from "@/hooks/useMediaQuery"
import Navigation from "@/app/components/Navigation"
import { Header } from "@/app/components/Header"
import { cn } from "@/lib/utils"
import { useSearchParams } from "next/navigation"

type OrganizationsUnjoined = {
    id: number;
    name: string;
    requested: boolean;
};

function ChatOrganization() {
    const [unjoinedOrgs, setUnjoinedOrgs] = useState<OrganizationsUnjoined[]>([])
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [loading, setLoading] = useState(true)
    const isMobile = useMediaQuery('(max-width: 768px)');
    const currentOrg = useOrganizationStore().currentOrganization
    const searchParams = useSearchParams();

    const {
        organizations: myOrganizations,
        setCurrentOrganization,
    } = useOrganizationStore()

    const { user } = useUserStore()

    const [chatId, setChatId] = useState<string | null>(null);

    useEffect(() => {
        const id = searchParams.get('chatId');
        setChatId(id);
    }, [searchParams]);

    const fetchUnjoinedOrgs = async () => {
        try {
            const { data } = await axios.get<null, AxiosResponse<OrganizationsUnjoined[]>>('/api/organizations', {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('access_token')}`
                }
            })
            setUnjoinedOrgs(data)
        } catch {
            toast.error("Error al cargar organizaciones disponibles.")
        }
    }

    useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true)
                await fetchUnjoinedOrgs()
            } finally {
                setLoading(false)
            }
        }

        loadData()
    }, [])

    const handleJoin = async (id: number) => {
        try {
            setUnjoinedOrgs(unjoinedOrgs.map(org =>
                org.id === id ? { ...org, requested: true } : org
            ))

            await axios.post(`/api/organizations/${id}/join`, {
                user_id: user?.id
            }, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('access_token')}`
                }
            })

            toast.success("Solicitud enviada.")
        } catch {
            toast.error("No se pudo enviar la solicitud.")
        } finally {
            fetchUnjoinedOrgs()
        }
    }

    const handleSelect = async (orgId: number) => {
        const org = myOrganizations.find(o => o.id === orgId)

        if (org) {
            setCurrentOrganization(org)
            toast.success(`Organización seleccionada: ${org.name}`)
        }

        if (!chatId) {
            toast.error('No se encontró chat para vincular')
            return
        }

        try {
            await axios.patch('/api/telegram/changeOrganization', {
                organizationId: orgId,
                chatId,
            }, {
                headers: { Authorization: 'Bearer ' + localStorage.getItem('access_token') }
            });
            toast.success('Se vinculó la organización. Puedes volver al chat.');
            await axios.get(process.env.NEXT_PUBLIC_NULLIUS_AI_AUTH_WEBHOOK_URL + '?chatId=' + chatId)
        } catch {
            toast.error('Hubo un error al vincular el chat a la organización.');
        }
    }

    const closeMobileMenu = () => {
        setIsSidebarOpen(false);
    };

    return (
        <div className="flex h-screen">
            {!isMobile && (
                <aside className="hidden md:flex w-64 border-r flex-col h-screen sticky top-0">
                    <Navigation closeMobileMenu={closeMobileMenu} />
                </aside>
            )}
            <div className="flex-1 flex flex-col min-h-screen">
                <Header
                    isSidebarOpen={isSidebarOpen}
                    setIsSidebarOpen={setIsSidebarOpen}
                    isMobile={isMobile}
                    closeMobileMenu={closeMobileMenu}
                />
                <main className="max-w-3xl mx-auto py-10 px-4 space-y-10">
                    <h1 className="text-2xl font-bold">Selecciona la organización que quieras tener en tu chat</h1>
                    <section>
                        <h2 className="text-lg font-semibold px-4 mb-2">Tus organizaciones</h2>
                        {myOrganizations.length === 0 ? (
                            <p className="text-gray-500">No perteneces a ninguna organización.</p>
                        ) : (
                            <div className="space-y-4">
                                {myOrganizations.map(org => (
                                    <Card key={org.id} className={cn(
                                        "cursor-pointer hover:shadow-md",
                                        currentOrg?.id === org.id && "bg-secondary"
                                    )} onClick={() => handleSelect(org.id)}>
                                        <CardHeader>
                                            <CardTitle>{org.name}</CardTitle>
                                        </CardHeader>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </section>

                    <section>
                        <h2 className="text-lg font-semibold px-4 mb-2">Organizaciones disponibles</h2>
                        {loading ? (
                            <p className="text-gray-500">Cargando...</p>
                        ) : unjoinedOrgs.length === 0 ? (
                            <p className="text-gray-500">No hay organizaciones disponibles para unirse.</p>
                        ) : (
                            <div className="space-y-4">
                                {unjoinedOrgs.map(org => (
                                    <Card key={org.id}>
                                        <CardHeader className="flex flex-row items-center justify-between">
                                            <CardTitle>{org.name}</CardTitle>
                                            <Button
                                                variant="outline"
                                                onClick={() => handleJoin(org.id)}
                                                disabled={org.requested}
                                            >
                                                {org.requested ? "Solicitado" : "Solicitar unirse"}
                                            </Button>
                                        </CardHeader>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </section>
                </main>
            </div>
        </div>
    )
}

export default function ChatOrganizationPage() {
    return (
        <Suspense fallback={<div>Cargando...</div>}>
            <ChatOrganization />
        </Suspense>
    );
}