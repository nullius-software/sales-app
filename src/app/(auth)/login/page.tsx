'use client';

import { useRouter, useSearchParams } from "next/navigation";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner"
import { useEffect, useState, Suspense } from "react";
import axios, { AxiosError } from "axios";
import Link from "next/link";

const formSchema = z.object({
    email: z.string().email("Email invalido."),
    password: z.string()
        .min(8, "La contraseña debe tener al menos 8 caracteres.")
        .regex(/[a-z]/, "Debe incluir al menos una letra minúscula.")
        .regex(/[A-Z]/, "Debe incluir al menos una letra mayúscula.")
        .regex(/[0-9]/, "Debe incluir al menos un número.")
        .regex(/[^a-zA-Z0-9]/, "Debe incluir al menos un símbolo."),
})

const LoginPageContent = () => {
    const navigation = useRouter();
    const searchParams = useSearchParams();
    const [chatId, setChatId] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const id = searchParams.get('chatId');
        setChatId(id);
    }, [searchParams, navigation]);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            email: "",
            password: ""
        },
    })

    const handleSubmit = async (values: z.infer<typeof formSchema>) => {
        setIsSubmitting(true);
        try {
            await axios.post('/api/auth/login', values, { withCredentials: true })
            toast.success("Sesión iniciada correctamente");

            if (!chatId) {
                navigation.push("/");
                return
            }

            try {
                await axios.post('/api/telegram/saveChat', { userEmail: values.email, chatId })
                navigation.push('/login/success?chatId=' + chatId);
            } catch (error) {
                if (error instanceof AxiosError && error.status === 409) {
                    toast.error('El chat ya está registrado con otro usuario')
                    return
                }

                toast.error('Fallo al conectar el chat.');
            }
        } catch (error) {
            if (error instanceof AxiosError && error.status === 401) {
                toast.error('Email o contraseña incorrecta.')
                return
            }
            toast.error('Un error inesperado ocurrió. Por favor revisa tu conexión a internet.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="h-screen flex justify-center items-center sm:bg-gray-100">
            <div className="max-w-md w-full px-4 py-8 sm:bg-white rounded sm:shadow-md">
                <h1 className="text-2xl font-bold mb-4">Inicia Sesión en Nullius</h1>
                <Form {...form}>
                    <form onSubmit={(e) => { e.preventDefault(); form.handleSubmit(handleSubmit)(); }} className="space-y-8">
                        <FormField control={form.control} name="email" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Email</FormLabel>
                                <FormControl>
                                    <Input
                                        {...field}
                                        placeholder="Entra tu email"
                                        type="email"
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                        <FormField control={form.control} name="password" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Contraseña</FormLabel>
                                <FormControl>
                                    <Input
                                        {...field}
                                        placeholder="Entra tu contraseña"
                                        type="password"
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? 'Iniciando sesión...' : 'Inicia Sesión'}
                        </Button>
                    </form>
                </Form>
                <p className="text-center text-gray-500 mt-8 p-0">¿No tenes una cuenta? <Link className="text-primary underline-offset-4 hover:underline" href={`/register?${chatId ? `chatId=${chatId}` : ''}`}>Hace click acá</Link></p>
            </div>
        </div>
    );
};

const LoginPage = () => {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <LoginPageContent />
        </Suspense>
    );
};

export default LoginPage;