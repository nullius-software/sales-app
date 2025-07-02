import { decodeAccessToken } from '@/lib/auth/decodeAccessToken';
import pool from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server';

export async function PATCH(req: NextRequest) {
    const decodedToken = await decodeAccessToken();
    const userEmail = decodedToken.email;

    if (!userEmail) {
        return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const userResult = await pool.query(
        `SELECT id FROM users WHERE email = $1`,
        [userEmail]
    );

    if (userResult.rows.length === 0) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userId = userResult.rows[0].id;
    const { chatId, organizationId } = await req.json()

    if (!chatId || !organizationId) {
        return NextResponse.json({ error: 'chatId and organizationId are required' }, { status: 400 })
    }

    try {
        const client = await pool.connect()

        const result = await client.query(
            `
      INSERT INTO user_telegram_chats (user_id, telegram_chat_id, organization_id)
      VALUES ($1, $2, $3)
      ON CONFLICT (telegram_chat_id)
      DO UPDATE SET user_id = EXCLUDED.user_id, organization_id = EXCLUDED.organization_id
      RETURNING *
      `,
            [userId, chatId, organizationId]
        )

        client.release()
        return NextResponse.json({ message: 'Chat ID assigned successfully', data: result.rows[0] }, { status: 200 })
    } catch (error) {
        console.error('Error assigning telegram_chat_id:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}