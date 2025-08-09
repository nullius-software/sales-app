'use client';

import { useRouter, useSearchParams } from "next/navigation";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner"
import { useEffect, useState } from "react";
import axios, { AxiosError } from "axios";
import { Eye, EyeOff } from "lucide-react";
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

export default function LoginForm() {
    const navigation = useRouter();
    const searchParams = useSearchParams();
    const [chatId, setChatId] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);
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
                            <div className="relative">
                                <Input
                                    {...field}
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="Entra tu contraseña"
                                    className="pr-10"
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setShowPassword((prev) => !prev)}
                                    className="absolute right-1 top-1/2 -translate-y-1/2 p-2 h-auto w-auto"
                                    tabIndex={-1}
                                >
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    <span className="sr-only">
                                        {showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                                    </span>
                                </Button>
                            </div>
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )} />
                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Iniciando sesión...' : 'Inicia Sesión'}
                </Button>
            </form>
            <p className="text-center text-gray-500 mt-8 p-0">¿No tenes una cuenta? <Link className="text-primary underline-offset-4 hover:underline" href={`/register?${chatId ? `chatId=${chatId}` : ''}`}>Hace click acá</Link></p>
        </Form>
    )
}