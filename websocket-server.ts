import { WebSocketServer, WebSocket } from 'ws';
import { v4 as uuid } from 'uuid';
import { parse } from 'url';
import type { Product } from '@/interfaces/product';

type Sender = 'user' | 'bot';

type ChatMessage = {
    id: string;
    text: string;
    from: Sender;
};

const wss = new WebSocketServer({ port: 8081 });

wss.on('connection', async (ws: WebSocket, req) => {
    const { query } = parse(req.url!, true);
    const orgId = typeof query.orgId === 'string' ? query.orgId : null;
    const sessionId = typeof query.sessionId === 'string' ? query.sessionId : uuid();
    console.log('Cliente conectado | sesión:', sessionId);

    const saludo: ChatMessage = {
        id: uuid(),
        text:
            '¡Hola! Soy tu Chat Assistant 😊' +
            '\n\nPuedo ayudarte a consultar información sobre tu organización activa.' +
            '\nPor ejemplo:\n• Ver qué productos hay disponibles\n• Consultar el stock de un producto específico' +
            '\n\nSolo escribí algo como:\n➡️ “Qué productos tiene mi organización”\n➡️ “Cuánto stock hay de Alfajor Pepito”',
        from: 'bot'
    };
    ws.send(JSON.stringify(saludo));

    ws.on('message', async (data) => {
        let parsed;
        try {
            parsed = JSON.parse(data.toString());
        } catch (err) {
            console.error('Error al parsear el mensaje:', err);
            return;
        }

        const text = parsed.text.toLowerCase().trim();
        let replyText = '';

        if (text.includes('qué productos') || text.includes('productos tiene')) {
            if (!orgId) {
                replyText = 'No tengo información de tu organización en este momento.';
            } else {
                try {
                    const res = await fetch(`http://localhost:3000/api/products?organization_id=${orgId}`);
                    const { products = [] }: { products: Product[] } = await res.json();
                    replyText = products.length
                        ? `Los productos de tu organización son: ${products.map((p: Product) => p.name).join(', ')}`
                        : 'No se encontraron productos registrados.';
                } catch (err) {
                    replyText = 'Hubo un error consultando los productos. Por favor, intentá más tarde.';
                    console.error('Error al consultar productos:', err);
                }
            }
        }

        else if (text.includes('cuánto stock') || text.includes('hay de')) {
            const nombre = text.split('de')[1]?.trim();
            if (!nombre || !orgId) {
                replyText = 'No entendí qué producto querés consultar o falta la organización.';
            } else {
                try {
                    const res = await fetch(`http://localhost:3000/api/products?q=${encodeURIComponent(nombre)}&organization_id=${orgId}`);
                    const { products = [] }: { products: Product[] } = await res.json();
                    const producto = products.find((p: Product) => p.name.toLowerCase() === nombre.toLowerCase());
                    replyText = producto
                        ? `Hay ${producto.stock} unidades de ${producto.name}.`
                        : `No encontré el producto "${nombre}" en tu organización.`;
                } catch (err) {
                    replyText = 'Hubo un error consultando el stock. Intentá más tarde.';
                    console.error('Error al consultar stock:', err);
                }
            }
        }

        else {
            replyText = `Lo siento, no te entendí: "${parsed.text}". ¿Querés consultar productos o stock?`;
        }

        const reply: ChatMessage = {
            id: uuid(),
            text: replyText,
            from: 'bot'
        };

        ws.send(JSON.stringify(reply));
    });

    ws.on('close', () => {
        console.log('Cliente desconectado:', sessionId);
    });

    ws.on('error', (err) => {
        console.error('Error del WebSocket server:', err);
    });
});
