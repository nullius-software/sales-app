'use client'

import { useOrganizationStore } from "@/store/organizationStore";
import axios from "axios";
import { useEffect, useState } from "react";

export default function ProductsSold() {
    const [productsSold, setProductsSold] = useState(0);
    const { currentOrganization } = useOrganizationStore();

    useEffect(() => {
        if(!currentOrganization) return;

        const fetchProductsSold = async () => {
            const productsSoldFetched = await axios.get<{total: number}>(
                `/api/sales/total-products?organizationId=${currentOrganization?.id}`
            )
            setProductsSold(productsSoldFetched.data.total)
        }

        fetchProductsSold()
    }, [currentOrganization])

    return (
        <p className="text-2xl font-bold">{productsSold}</p>
    )
}