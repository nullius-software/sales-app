import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

export async function POST(req: NextRequest) {
    const { email, password } = await req.json();

    const params = new URLSearchParams();
    params.append("grant_type", "password");
    params.append("client_id", process.env.KEYCLOAK_CLIENT_ID!);
    params.append("client_secret", process.env.KEYCLOAK_CLIENT_SECRET!);
    params.append("username", email);
    params.append("password", password);

    try {
        const { data } = await axios.post(
            `${process.env.KEYCLOAK_URL}/realms/nullius-realm/protocol/openid-connect/token`,
            params,
            { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
        );

        return NextResponse.json(data);
    } catch {
        return NextResponse.json({ error: "Error al autenticar" }, { status: 401 });
    }
}
