"use client";

import axios from "axios";
import { decodeAccessToken } from "./decodeAccessToken";

export interface User {
  id: string;
  email: string;
}

export async function getCurrentUser() {
  try {
    const decodedToken = await decodeAccessToken();
    const { email } = decodedToken;
    const { data } = await axios.get<User>(`/api/users/email/${email}`);
    return data;
  } catch (err) {
    throw new Error(`Error fetching user: ${err}`); // <----------
  }
}
