'use client';

import { useEffect, useRef, useState } from 'react';
import { useChatWebSocket } from '@/hooks/useChatWebSocket';

export default function ChatPage() {
    const { messages, status, sendMessage } = useChatWebSocket();
    const [input, setInput] = useState('');
    const bottomRef = useRef<HTMLDivElement>(null);

    const handleSend = () => {
        if (input.trim()) {
            sendMessage(input.trim());
            setInput('');
        }
    };

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const BotIcon = () => (
        <svg
            className="w-5 h-5 mr-2 text-primary shrink-0"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
        >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2v2m0 16v2m8-10h2M2 12H4m15.36-6.36l1.42 1.42M5.22 17.78l1.42 1.42M17.78 18.78l-1.42-1.42M6.64 5.64L5.22 4.22M12 6a6 6 0 100 12 6 6 0 000-12z" />
        </svg>
    );

    const UserIcon = () => (
        <svg
            className="w-5 h-5 mr-2 text-white shrink-0"
            xmlns="http://www.w3.org/2000/svg"
            fill="currentColor"
            viewBox="0 0 24 24"
        >
            <path d="M12 12c2.7 0 5-2.3 5-5s-2.3-5-5-5-5 2.3-5 5 2.3 5 5 5zM4 20c0-2.2 4-4 8-4s8 1.8 8 4v2H4v-2z"/>
        </svg>
    );

    return (
        <div className="flex flex-col flex-1 p-4 bg-gray-50">
            <div className="flex-1 overflow-auto space-y-2 mb-4">
                {messages.map((m) => (
                    <div
                        key={m.id}
                        className={`flex items-start px-4 py-3 rounded-xl text-[15px] leading-relaxed whitespace-pre-line transform transition-all duration-300 max-w-[80%] ${
                            m.from === 'user'
                                ? 'bg-primary/40 self-end text-white shadow-md'
                                : 'bg-zinc-100/80 self-start text-gray-900 shadow-sm'
                        }`}
                    >
                        {m.from === 'bot' ? <BotIcon /> : <UserIcon />}
                        <div>
                            {m.from === 'bot'
                                ? m.text.split('\n').map((line, i) => (
                                    <span key={i}>
                                          {line}
                                        <br />
                                      </span>
                                ))
                                : m.text}
                        </div>
                    </div>
                ))}

                {status === 'connecting' && (
                    <p className="italic text-sm text-gray-500">Conectando…</p>
                )}
                {status === 'error' && (
                    <p className="text-red-500">Error de conexión.</p>
                )}

                <div ref={bottomRef} />
            </div>

            <div className="flex space-x-2">
                <input
                    className="flex-1 border border-gray-300 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/50 transition"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    placeholder="Escribí tu mensaje…"
                />
                <button
                    className="px-4 py-2 bg-primary text-white rounded-xl hover:bg-primary/80 transition disabled:opacity-50"
                    onClick={handleSend}
                    disabled={status !== 'open'}
                >
                    Enviar
                </button>
            </div>
        </div>
    );
}
