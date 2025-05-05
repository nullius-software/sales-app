import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function POST(request: Request) {
  const { userEmail, chatId } = await request.json();

  if (!userEmail || !chatId) {
    return NextResponse.json({ message: 'Missing userEmail or chatId' }, { status: 400 });
  }

  try {
    const userResult = await db.query('SELECT id FROM users WHERE email = $1', [userEmail]);

    if (userResult.rowCount === 0) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    const userId = userResult.rows[0].id;

    const result = await db.query(
      'INSERT INTO user_telegram_chats (user_id, telegram_chat_id) VALUES ($1, $2) ON CONFLICT (user_id, telegram_chat_id) DO NOTHING RETURNING *',
      [userId, chatId]
    );

    if (result.rowCount && result.rowCount > 0) {
      return NextResponse.json({ message: 'Chat saved successfully', chat: result.rows[0] }, { status: 201 });
    } else {
      return NextResponse.json({ message: 'Chat already exists for this user' }, { status: 200 });
    }
  } catch (error) {
    console.error('Error saving chat:', error);
    return NextResponse.json({ message: 'Error saving chat', error }, { status: 500 });
  }
}