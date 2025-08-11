import pool from '@/lib/db';
import { encryptPassword } from '@/tools/encryptPassword';
import axios, { AxiosError } from 'axios';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const { email, password } = await request.json();

  if (!email || typeof email !== 'string') {
    return NextResponse.json({ error: 'Email is required' }, { status: 400 });
  }

  if (!password || typeof password !== 'string') {
    return NextResponse.json(
      { error: 'password is required' },
      { status: 400 }
    );
  }

  const client = await pool.connect();
  const { encrypted, iv } = encryptPassword(password);
  try {
    await client.query(
      'INSERT INTO users (email, password, password_iv) VALUES ($1, $2, $3)',
      [email, encrypted, iv]
    );
  } catch (error) {
    return NextResponse.json({ error }, { status: 409 });
  }

  const {
    data: { access_token },
  } = await axios.post(
    process.env.KEYCLOAK_URL +
      '/realms/nullius-realm/protocol/openid-connect/token',
    {
      grant_type: 'client_credentials',
      client_id: process.env.KEYCLOAK_ADMIN_CLIENT_ID,
      client_secret: process.env.KEYCLOAK_ADMIN_CLIENT_SECRET,
    },
    { headers: { 'Content-type': 'application/x-www-form-urlencoded' } }
  );

  try {
    await axios.post(
      process.env.KEYCLOAK_URL + '/admin/realms/nullius-realm/users',
      {
        email,
        enabled: true,
        credentials: [
          {
            type: 'password',
            value: password,
            temporary: false,
          },
        ],
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${access_token}`,
        },
      }
    );
  } catch (error) {
    if (error instanceof AxiosError && error.status) {
      return NextResponse.json({ error }, { status: error.status });
    }

    await client.query('DELETE FROM users where email=$1', [email]);

    return NextResponse.json({ error }, { status: 500 });
  }

  client.release();

  return NextResponse.json({ success: true });
}
