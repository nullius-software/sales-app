import axios from 'axios';
import { cookies } from 'next/headers';

export async function introspectToken() {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('access_token')?.value;
    if (!accessToken) throw new Error('No access token found');

    const params = new URLSearchParams();
    params.append('token', accessToken);
    params.append('client_id', process.env.KEYCLOAK_CLIENT_ID!);
    params.append('client_secret', process.env.KEYCLOAK_CLIENT_SECRET!);

    const { data } = await axios.post(
        `${process.env.KEYCLOAK_URL}/realms/nullius-realm/protocol/openid-connect/token/introspect`,
        params,
        {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        }
    );

    return data;
}
