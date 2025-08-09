'use client'

import { Suspense, useEffect, useState } from "react"
import axios from "axios"
import { toast } from "sonner"

import { Card, CardHeader, CardTitle } from "@/components/ui/card"

import { useOrganizationStore } from "@/store/organizationStore"
import { cn } from "@/lib/utils"
import { useSearchParams } from "next/navigation"
import { SearchOrganization } from "@/components/shared/SearchOrganization"

function ChatOrganization() {
    const currentOrg = useOrganizationStore().currentOrganization
    const searchParams = useSearchParams();

    const {
        organizations: myOrganizations,
        setCurrentOrganization,
    } = useOrganizationStore()

    const [chatId, setChatId] = useState<string | null>(null);

    useEffect(() => {
        const id = searchParams.get('chatId');
        setChatId(id);
    }, [searchParams]);

    const handleSelect = async (orgId: number) => {
        const org = myOrganizations.find(o => o.id === orgId)

        if (!org) return

        setCurrentOrganization(org)

        if (!chatId) {
            toast.error('No se encontró chat para vincular')
            return
        }

        try {
            toast(`Organización seleccionada: ${org.name}`)
            await axios.patch('/api/telegram/changeOrganization', {
                organizationId: orgId,
                chatId,
            }, {
                withCredentials: true
            });
            toast.success('Se vinculó la organización. Puedes volver al chat.');
            await axios.get(process.env.NEXT_PUBLIC_NULLIUS_AI_AUTH_WEBHOOK_URL + '?chatId=' + chatId)
        } catch {
            toast.error('Hubo un error al vincular el chat a la organización.');
        }
    }

    return (
        <div className="w-full max-w-3xl mx-auto flex justify-center items-start flex-col gap-8 h-full px-8">
            <h1 className="text-2xl font-bold">Selecciona la organización que quieras tener en tu chat</h1>
            <section className="w-full">
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

            <section className="w-full">
                <h2 className="text-lg font-semibold px-4 mb-4">Organizaciones disponibles</h2>
                <SearchOrganization />
            </section>
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