'use server';

import RegisterForm from "@/app/components/auth/RegisterForm";
import { Suspense } from "react";

export default async function RegisterPage() {
    return (
        <div className="h-full flex flex-col justify-center items-center bg-gray-100">
            <h1 className="my-auto text-2xl font-bold mb-4 sm:hidden">Registrate en Nullius</h1>
            <div className="mt-auto w-full px-4 py-8 bg-white rounded-t-4xl shadow-md min-h-1/2 sm:min-h-0 sm:rounded sm:w-md sm:mt-0">
                <h1 className="text-2xl font-bold mb-4 hidden sm:block">Registrate en Nullius</h1>
                <Suspense fallback={<div>Loading...</div>}>
                    <RegisterForm />
                </Suspense>
            </div>
        </div>
    );
};