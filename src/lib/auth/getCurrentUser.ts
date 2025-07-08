'use server'

import axios from "axios";
import { decodeAccessToken } from "./decodeAccessToken";

export type User = {
    id: string;
    email: string;
};

export async function getCurrentUser() {
    try {
        const decodedToken = await decodeAccessToken();
        const { email } = decodedToken
        const { data } = await axios.get<User>(`${process.env.NEXT_BASE_URL}/api/users/email/${email}`);
        return data;
    } catch (err) {
        console.error('Error fetching user:', err);
    }
}