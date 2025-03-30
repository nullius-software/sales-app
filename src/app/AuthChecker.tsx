'use client';

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useEffect } from "react";

export function AuthChecker() {
    const navigation = useRouter();

    useEffect(() => {
        const checkUserLoggedIn = async () => {
            const accessToken = localStorage.getItem("access_token");
            if (!accessToken) {
                navigation.push("/login");
                return;
            }

            try {
                const response = await fetch("/auth/realms/nullius-realm/protocol/openid-connect/token/introspect", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/x-www-form-urlencoded",
                    },
                    body: new URLSearchParams({
                        token: accessToken,
                        client_id: "auth-service-client",
                        client_secret: "UPIdbaD9HmzHblyBKiIm5DqdrIzXDlSZ",
                    }),
                });

                if (!response.ok) {
                    throw new Error("Unauthorized");
                }

                toast.success("Logged in successfully");
            } catch (error) {
                if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
                    toast.error('Unable to connect to the server. Please check your internet connection.');
                    navigation.push("/login");
                    return
                }

                toast.error("Session expired. Please log in again.");
                localStorage.removeItem("access_token");
                navigation.push("/login");
            }
        };

        checkUserLoggedIn();
    }, [navigation]);

    return <></>;
}