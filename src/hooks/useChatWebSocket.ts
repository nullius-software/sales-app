import { useEffect, useRef, useState, useCallback } from 'react';
import { v4 as uuid } from 'uuid';
import { useOrganizationStore } from '@/store/organizationStore';

type ChatMessage = { id: string; text: string; from: 'user' | 'bot' };

export function useChatWebSocket() {
    const { currentOrganization } = useOrganizationStore();
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [status, setStatus] = useState<'connecting'|'open'|'closed'|'error'>('connecting');
    const wsRef = useRef<WebSocket|null>(null);

    useEffect(() => {
        if (!currentOrganization) return;

        const wsUrl = `ws://localhost:8081?orgId=${currentOrganization.id}`;
        console.log('Conectando a WebSocket en:', wsUrl);

        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => setStatus('open');
        ws.onerror = (event) => {
            if (ws.readyState !== WebSocket.OPEN) {
                console.error('Error en WebSocket:', {
                    url: ws.url,
                    state: ws.readyState,
                    event
                });
            }
        };

        ws.onclose = () => setStatus('closed');

        ws.onmessage = ({ data }) => {
            const msg: ChatMessage = JSON.parse(data.toString());
            setMessages((prev) => [...prev, msg]);
        };

        return () => {
            ws.close();
            setStatus('closed');
        };
    }, [currentOrganization]);

    const sendMessage = useCallback((text: string) => {
        if (wsRef.current && status === 'open') {
            const id = uuid();
            const msg: ChatMessage = { id, text, from: 'user' };
            wsRef.current.send(JSON.stringify(msg));
            setMessages((prev) => [...prev, msg]);
        }
    }, [status]);

    return { messages, status, sendMessage };
}