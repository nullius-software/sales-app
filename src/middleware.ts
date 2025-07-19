import axios from "axios";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const accessToken = request.cookies.get("access_token")?.value;
  const refreshToken = request.cookies.get("refresh_token")?.value;

  if (!refreshToken) return NextResponse.next();

  try {
    try {
      if (!accessToken) throw new Error("No access token found");

      const params = new URLSearchParams();
      params.append("token", accessToken);
      params.append("client_id", process.env.KEYCLOAK_CLIENT_ID!);
      params.append("client_secret", process.env.KEYCLOAK_CLIENT_SECRET!);

      await axios.post(
        `${process.env.KEYCLOAK_URL}/realms/nullius-realm/protocol/openid-connect/token/introspect`,
        params,
        {
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
        }
      );

      return NextResponse.next();
    } catch (error) {
      const data = await refreshAccessToken(refreshToken);
      const response = NextResponse.next();
      response.cookies.set("access_token", data.access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 60 * 60,
      });

      response.cookies.set("refresh_token", data.refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
      });
      return response;
    }
  } catch (error) {
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};

async function refreshAccessToken(refreshToken: string) {
  const tokenUrl = `${process.env.KEYCLOAK_URL}/realms/nullius-realm/protocol/openid-connect/token`;

  const params = new URLSearchParams();
  params.append("grant_type", "refresh_token");
  params.append("client_id", process.env.KEYCLOAK_CLIENT_ID!);
  params.append("client_secret", process.env.KEYCLOAK_CLIENT_SECRET!);
  params.append("refresh_token", refreshToken);

  console.log("refresh");
  try {
    const { data } = await axios.post(tokenUrl, params, {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });
    return data;
  } catch (error) {
    console.log(error);
    throw new Error("Error al refrescar el token de acceso");
  }
}
