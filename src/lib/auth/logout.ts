'use server'

import axios from "axios";
import { cookies } from "next/headers";

export const logout = async () => {
    const cookiesStore = await cookies()
    const refreshToken = cookiesStore.get('refresh_token')?.value;

    if (!refreshToken) {
        cookiesStore.delete('access_token');
        cookiesStore.delete('refresh_token');
        return;
    }

    await axios.post(
        `${process.env.KEYCLOAK_URL}/realms/nullius-realm/protocol/openid-connect/logout`,
        new URLSearchParams({
            client_id: `${process.env.KEYCLOAK_CLIENT_ID}`,
            client_secret: `${process.env.KEYCLOAK_CLIENT_SECRET}`,
            refresh_token: refreshToken,
        }), {
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
    });

    cookiesStore.delete('access_token');
    cookiesStore.delete('refresh_token');
};