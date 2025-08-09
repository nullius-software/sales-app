'use client';

import '@n8n/chat/style.css';
import { createChat } from '@n8n/chat';
import { useEffect, useRef } from 'react';

export default function Chat({ userId }: { userId: string }) {
  const chatRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (chatRef && chatRef.current) {
      createChat({
        webhookUrl: process.env.NEXT_PUBLIC_NULLIUS_AI_CHAT_WEBHOOK_URL,
        webhookConfig: {
          method: 'POST',
          headers: {},
        },
        target: chatRef.current,
        mode: 'fullscreen',
        chatInputKey: 'chatInput',
        chatSessionKey: 'sessionId',
        loadPreviousSession: true,
        metadata: {
          userId: userId || 'unknown',
        },
        showWelcomeScreen: false,
        showWindowCloseButton: false,
        allowFileUploads: true,
        initialMessages: [
          '¡Hola! Soy Nullius, tu asistente para gestionar inventario 👋🏻',
          'Estoy acá para ayudarte a gestionar tu inventario. ¡No dudes en enviar mensajes de texto o audio para registrar tus productos!',
          'También puedes pasarme una imagen de un recibo de compra para actualizar tu stock.',
        ],
        i18n: {
          en: {
            title: '',
            subtitle: '',
            footer: '',
            getStarted: 'Nueva conversación',
            inputPlaceholder: 'Escribe tu consulta...',
            closeButtonTooltip: 'Cerrar',
          },
        },
      });
    }
  }, [userId]);

  return <div ref={chatRef} className="h-full" />;
}
