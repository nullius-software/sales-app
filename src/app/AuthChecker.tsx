'use client';

import { useRouter, usePathname } from "next/navigation";
import { toast } from "sonner";
import { useEffect } from "react";
import axios, { AxiosError } from "axios";
import { decodeJWT } from "@/lib/utils";
import { useUserStore } from "@/store/userStore";

export function AuthChecker() {
    const navigation = useRouter();
    const pathname = usePathname();
    const setUser = useUserStore((state) => state.setUser);

    useEffect(() => {
        async function fetchUserByEmail(email: string) {
            try {
                console.log("email")
                console.log(email)
                const res = await axios.get(`/api/users/email/${email}`);
                if (res.status === 404) throw new Error('User not found');
                const user = res.data;
                setUser(user);
            } catch (err) {
                console.error('Error fetching user:', err);
            }
        }

        const checkUserLoggedIn = async () => {
            const accessToken = localStorage.getItem("access_token");

            if (!accessToken) {
                if (pathname !== '/login' && pathname !== '/register') navigation.push("/login");
                return;
            }

            if (pathname === "/login") {
                navigation.push("/");
            }

            try {
                await axios.post('/api/auth/introspect', { accessToken })

                const justLoggedIn = localStorage.getItem("just_logged_in");
                if (justLoggedIn === "true") {
                    toast.success("Sesión iniciada correctamente");
                    localStorage.removeItem("just_logged_in");
                }

                const { email } = decodeJWT(accessToken)

                await fetchUserByEmail(email)
            } catch (error) {
                if (error instanceof AxiosError && error.status === 500) {
                    toast.error('Un error inesperado ocurrió. Por favor revisa tu conexión a internet.');
                    navigation.push("/login");
                    return;
                }

                toast.error("Sesión expirada. Por favor, vuelve a iniciar sesión");
                localStorage.removeItem("access_token");
                localStorage.removeItem("refresh_token");
                navigation.push("/login");
            }
        };

        checkUserLoggedIn();
    }, [navigation, pathname, setUser]);

    return <></>;
}