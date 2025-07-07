import { NextRequest, NextResponse } from "next/server";
import axios, { AxiosError } from "axios";

export async function POST(req: NextRequest) {
  const accessToken = req.cookies.get("access_token")?.value;

  if (!accessToken) {
    console.log("error autenticando:", req.cookies);
    return NextResponse.json(
      { error: "Token no proporcionado" },
      { status: 401 },
    );
  }

  const params = new URLSearchParams();
  params.append("token", accessToken);
  params.append("client_id", process.env.KEYCLOAK_CLIENT_ID!);
  params.append("client_secret", process.env.KEYCLOAK_CLIENT_SECRET!);

  try {
    const { data } = await axios.post(
      `${process.env.KEYCLOAK_URL}/realms/nullius-realm/protocol/openid-connect/token/introspect`,
      params,
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      },
    );

    return NextResponse.json(data);
  } catch (e) {
    if (e instanceof AxiosError && e.status === 401) {
      return NextResponse.json(
        { error: "Error al autenticar" },
        { status: 401 },
      );
    }

    return NextResponse.json({ error: "Error del servidor" }, { status: 500 });
  }
}
