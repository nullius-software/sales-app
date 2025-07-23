'use client'

import { useOrganizationStore } from "@/store/organizationStore";
import axios from "axios";
import { useEffect, useState } from "react";

export default function AverageTicket() {
    const [averageTicket, setAverageTicket] = useState(0);
    const { currentOrganization } = useOrganizationStore();

    useEffect(() => {
        if (!currentOrganization) return;

        const fetchAverageTicket = async () => {
            const averageTicketFeched = await axios.get<{ total: number }>(
                `/api/sales/average-ticket?organizationId=${currentOrganization?.id}`
            )
            setAverageTicket(averageTicketFeched.data.total)
        }

        fetchAverageTicket()
    }, [currentOrganization])

    return (
        <p className="text-2xl font-bold">${averageTicket.toFixed(2)}</p>
    )
}