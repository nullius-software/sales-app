import { Card, CardDescription, CardTitle } from "@/components/ui/card"

const LoginSuccessPage = () => {
    return (
        <div className="h-screen flex justify-center items-center bg-gray-100">
            <Card className="p-10">
                <CardTitle>Autenticado correctamente.</CardTitle>
                <CardDescription>Ya puedes cerrar esta ventana y volver a tu asistente.</CardDescription>
            </Card>
        </div>
    )
}

export default LoginSuccessPage;