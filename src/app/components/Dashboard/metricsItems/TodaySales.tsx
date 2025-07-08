'use client'

import { useOrganizationStore } from "@/store/organizationStore";
import axios from "axios";
import { useEffect, useState } from "react";

export default function TodaySales() {
    const [todaySales, setTodaySales] = useState(0);
    const { currentOrganization } = useOrganizationStore();

    useEffect(() => {
        if (!currentOrganization) return;

        const fetchTodaySales = async () => {
            const todaySalesFetched = await axios.get<{ total: number }>(
                `/api/sales/today?organizationId=${currentOrganization.id}`
            )
            setTodaySales(todaySalesFetched.data.total)
        }

        fetchTodaySales()
    }, [currentOrganization])

    return (
        <p className="text-2xl font-bold">${todaySales}</p>
    )
}