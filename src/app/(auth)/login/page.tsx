'use server';

import LoginForm from "@/app/components/auth/LoginForm";
import { Suspense } from "react";

export default async function LoginPage() {
    return (
        <div className="h-screen flex justify-center items-center sm:bg-gray-100">
            <div className="max-w-md w-full px-4 py-8 sm:bg-white rounded sm:shadow-md">
                <h1 className="text-2xl font-bold mb-4">Inicia Sesión en Nullius</h1>
                <Suspense fallback={<div>Loading...</div>}>
                    <LoginForm />
                </Suspense>
            </div>
        </div>
    );
};