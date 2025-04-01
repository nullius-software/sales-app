'use client';

import { useRouter } from "next/navigation";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner"

const formSchema = z.object({
    email: z.string().email("Invalid email address"),
    password: z.string().min(3, "Password must be at least 6 characters long"),
})

const LoginPage = () => {
    const navigation = useRouter();

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            email: "",
            password: ""
        },
    })

    const handleSubmit = async (values: z.infer<typeof formSchema>) => {
        try {
            const response = await fetch("/auth/realms/nullius-realm/protocol/openid-connect/token", {
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                },
                body: new URLSearchParams({
                    grant_type: "password",
                    client_id: "auth-service-client",
                    client_secret: "UPIdbaD9HmzHblyBKiIm5DqdrIzXDlSZ",
                    username: values.email,
                    password: values.password,
                }),
            });

            if (response.ok) {
                const data = await response.json();
                localStorage.setItem("access_token", data.access_token);
                localStorage.setItem("refresh_token", data.refresh_token);
                navigation.push("/");
            } else {
                toast.error('Invalid email or password');
            }
        } catch (error) {
            if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
                toast.error('Unable to connect to the server. Please check your internet connection.');
            } else {
                toast.error('An unexpected error occurred');
            }
        }
    };

    return (
        <div className="h-screen flex justify-center items-center bg-gray-100">
            <div className="max-w-md w-full px-4 py-8 bg-white rounded shadow-md">
                <h1 className="text-2xl font-bold mb-4">Login on Nullius</h1>
                <Form {...form}>
                    <form onSubmit={(e) => { e.preventDefault(); form.handleSubmit(handleSubmit)(); }} className="space-y-8">
                        <FormField control={form.control} name="email" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Email</FormLabel>
                                <FormControl>
                                    <Input
                                        {...field}
                                        placeholder="Enter your email"
                                        type="email"
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                        <FormField control={form.control} name="password" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Password</FormLabel>
                                <FormControl>
                                    <Input
                                        {...field}
                                        placeholder="Enter your password"
                                        type="password"
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                        <Button type="submit">
                            Login
                        </Button>
                    </form>
                </Form>
            </div>
        </div>
    );
};

export default LoginPage;

