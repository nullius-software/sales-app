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
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";

const formSchema = z.object({
    email: z.string().email("Email invalido."),
    password: z.string()
        .min(8, "La contraseña debe tener al menos 8 caracteres.")
        .regex(/[a-z]/, "Debe incluir al menos una letra minúscula.")
        .regex(/[A-Z]/, "Debe incluir al menos una letra mayúscula.")
        .regex(/[0-9]/, "Debe incluir al menos un número.")
        .regex(/[^a-zA-Z0-9]/, "Debe incluir al menos un símbolo."),
    confirmPassword: z.string().nonempty("Requerido"),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden.",
    path: ["confirmPassword"],
});

export default function RegisterForm() {
    const navigation = useRouter();
    const searchParams = useSearchParams();
    const [chatId, setChatId] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    useEffect(() => {
        const id = searchParams.get('chatId');
        setChatId(id);
    }, [searchParams, navigation]);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            email: "",
            password: "",
            confirmPassword: "",
        },
    });


    const handleSubmit = async (values: z.infer<typeof formSchema>) => {
        setIsSubmitting(true);
        try {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { confirmPassword, ...dataToSend } = values;
            await axios.post("/api/register", dataToSend)
            await axios.post('/api/auth/login', dataToSend, { withCredentials: true })

            if (!chatId) {
                toast.success("Usuario registrado correctamente.");
                navigation.push("/organizations");
                return
            }

            try {
                await axios.post('/api/telegram/saveChat', { userEmail: dataToSend.email, chatId })
                navigation.push('/login/success?chatId=' + chatId);
            } catch (error) {
                if (error instanceof AxiosError && error.status === 409) {
                    toast.error('El chat ya está registrado con otro usuario')
                    return
                }

                toast.error('Fallo al conectar el chat.');
            }
        } catch (e) {
            if (e instanceof AxiosError && e.status === 409) {
                toast.error('El usuario con este mail ya tiene una cuenta.')
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
                <FormField control={form.control} name="confirmPassword" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Confirmar contraseña</FormLabel>
                        <FormControl>
                            <div className="relative">
                                <Input
                                    {...field}
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    placeholder="Repetí la contraseña"
                                    className="pr-10"
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                                    className="absolute right-1 top-1/2 -translate-y-1/2 p-2 h-auto w-auto"
                                    tabIndex={-1}
                                >
                                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
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
                    {isSubmitting ? 'Registrando...' : 'Registrate'}
                </Button>
            </form>
            <p className="text-center text-gray-500 mt-8 p-0">
                ¿Ya tenes una cuenta? <Link className="text-primary underline-offset-4 hover:underline" href={`/login?${chatId ? `chatId=${chatId}` : ''}`}>Hace click acá</Link>
            </p>
        </Form>
    )
}