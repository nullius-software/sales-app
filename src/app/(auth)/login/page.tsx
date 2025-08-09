import LoginForm from "@/app/components/auth/LoginForm";
import { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: 'Inicia Sesión - Nullius',
  description: 'Inicia sesión en Nullius para acceder a tu sistema de gestión de inventario y ventas.',
};

export default async function LoginPage() {
    return (
        <div className="h-full flex flex-col justify-center items-center bg-gray-100">
            <div className="w-full px-4 py-8 bg-white rounded-t-4xl shadow-md sm:rounded sm:w-md">
                <h1 className="text-2xl font-bold mb-4 text-center">Inicia Sesión en Nullius</h1>
                <Suspense fallback={<div>Loading...</div>}>
                    <LoginForm />
                </Suspense>
            </div>
        </div>
    );
};