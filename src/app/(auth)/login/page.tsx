'use server';

import LoginForm from "@/components/features/auth/LoginForm";
import { Suspense } from "react";

export default async function LoginPage() {
    return (
        <div className="h-full flex flex-col justify-center items-center bg-gray-100">
            <h1 className="my-auto text-2xl font-bold mb-4 sm:hidden">Inicia Sesión en Nullius</h1>
            <div className="mt-auto w-full px-4 py-8 bg-white rounded-t-4xl shadow-md min-h-1/2 sm:min-h-0 sm:rounded sm:w-md sm:mt-0">
                <h2 className="text-2xl font-bold mb-4 hidden sm:block">Inicia Sesión en Nullius</h2>
                <Suspense fallback={<div>Loading...</div>}>
                    <LoginForm />
                </Suspense>
            </div>
        </div>
    );
};