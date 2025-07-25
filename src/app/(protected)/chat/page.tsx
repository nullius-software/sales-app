'use client';

import { useEffect, useRef, useState } from 'react';
import { useChatWebSocket } from '@/hooks/useChatWebSocket';
import { BotMessageSquareIcon, MessageSquareIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

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
        if(messages.length) {
            bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, bottomRef]);

    return (
        <div className="flex flex-col flex-1 p-4 bg-gray-50">
            <div className="flex-1 overflow-auto space-y-2 px-10 mb-4 flex flex-col">
                {messages.map((m) => (
                    <div
                        key={m.id}
                        className={`flex items-start px-4 py-3 gap-2 rounded-xl text-[15px] leading-relaxed whitespace-pre-line transform transition-all duration-300 max-w-[80%] ${
                            m.from === 'user'
                                ? 'bg-primary/40 self-end text-white shadow-md'
                                : 'bg-zinc-100/80 self-start text-gray-900 shadow-sm'
                        }`}
                    >
                        {m.from === 'bot' && 
                        <div>
                            <BotMessageSquareIcon className="h-4 w-4" size={16} />
                        </div>
                        }
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
                        {m.from === 'user' && 
                        <div>
                            <MessageSquareIcon className="h-4 w-4" size={16} />
                        </div>
                        }
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
                <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    placeholder="Escribí tu mensaje…"
                />
                <Button
                    type="button"
                    onClick={handleSend}
                    disabled={status !== 'open'}
                >
                    Enviar
                </Button>
            </div>
        </div>
    );
}
