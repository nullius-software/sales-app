"use client";

import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import axios from "axios";
import { useEffect } from "react";

const LoginSuccessPage = ({ chatId }: { chatId: string }) => {
  useEffect(() => {
    const webhookCall = async () => {
      await axios.get(
        process.env.NEXT_PUBLIC_NULLIUS_AI_AUTH_WEBHOOK_URL +
          "?chatId=" +
          chatId,
      );
    };

    webhookCall();
  }, [chatId]);

  return (
    <div className="h-screen flex justify-center items-center bg-gray-100">
      <Card className="p-10">
        <CardTitle>Autenticado correctamente.</CardTitle>
        <CardDescription>
          Ya puedes cerrar esta ventana y volver a tu asistente.
        </CardDescription>
      </Card>
    </div>
  );
};

export default function Page({
  searchParams,
}: {
  searchParams: { chatId?: string };
}) {
  if (searchParams.chatId)
    return <LoginSuccessPage chatId={searchParams.chatId} />;

  return (
    <div className="h-screen flex justify-center items-center bg-gray-100">
      <Card className="p-10 bg-red-400 text-white">
        <CardTitle>Ocurrió un error. Lo sentimos</CardTitle>
        <CardDescription className="text-white">
          Recomendamos cerrar la aplicación y volver a acceder desde tu
          asistente.
        </CardDescription>
      </Card>
    </div>
  );
}
