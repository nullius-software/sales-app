'use client';

import { useRouter, usePathname } from "next/navigation";
import { toast } from "sonner";
import { useEffect } from "react";

export function AuthChecker() {
    const navigation = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        const checkUserLoggedIn = async () => {
            const accessToken = localStorage.getItem("access_token");

            if (!accessToken) {
                if(pathname !== '/login') navigation.push("/login");
                return;
            }

            if (pathname === "/login") {
                navigation.push("/");
            }

            try {
                const response = await fetch("/auth/realms/nullius-realm/protocol/openid-connect/token/introspect", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/x-www-form-urlencoded",
                    },
                    body: new URLSearchParams({
                        token: accessToken,
                        client_id: `${process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT_ID}`,
                        client_secret: `${process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT_SECRET}`,
                    }),
                });

                if (!response.ok) {
                    throw new Error("Unauthorized");
                }

                const justLoggedIn = localStorage.getItem("just_logged_in");
                if (justLoggedIn === "true") {
                    toast.success("Logged in successfully");
                    localStorage.removeItem("just_logged_in");
                }
            } catch (error) {
                if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
                    toast.error('Unable to connect to the server. Please check your internet connection.');
                    navigation.push("/login");
                    return;
                }

                toast.error("Session expired. Please log in again.");
                localStorage.removeItem("access_token");
                navigation.push("/login");
            }
        };

        checkUserLoggedIn();
    }, [navigation, pathname]);

    return <></>;
}