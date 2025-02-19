import bcrypt from "bcryptjs";
import { getCurrentTimestampISO } from "../tools/timestamp";
import { apiGet, apiPost } from "../database";

interface User {
    id: number;
    username: string;
    hashed_password: string;
    email: string;
    createdAt?: string;
    lastLogin?: string;
}

export async function POST(req: Request): Promise<Response> {
    try {
        const { username, password, email } = await req.json();

        if (!username || !password || !email) {
            return new Response(
                JSON.stringify({
                    message: "Username, password and email are required",
                }),
                { status: 400, headers: { "Content-Type": "application/json" } }
            );
        }

        const existingUserQuery = `SELECT * FROM snp_users WHERE username = ? OR email = ?`;
        const existingUsers = (await apiGet(existingUserQuery, [
            username,
            email,
        ])) as User[];
        if (existingUsers.length > 0) {
            return new Response(
                JSON.stringify({ message: "Username or email already exists" }),
                { status: 400, headers: { "Content-Type": "application/json" } }
            );
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const createdAt = getCurrentTimestampISO();

        const insertUserQuery = `
      INSERT INTO snp_users (username, hashed_password, email, createdAt)
      VALUES (?, ?, ?, ?)
    `;
        await apiPost(insertUserQuery, [
            username,
            hashedPassword,
            email,
            createdAt,
        ]);

        const userIdQuery = `SELECT id FROM snp_users WHERE username = ?`;
        const userRows = (await apiGet(userIdQuery, [username])) as {
            id: number;
        }[];
        if (!userRows || userRows.length === 0) {
            return new Response(
                JSON.stringify({
                    message: "User not found after registration",
                }),
                { status: 500, headers: { "Content-Type": "application/json" } }
            );
        }
        const userId = userRows[0].id;

        const insertSettingsQuery = `
      INSERT INTO snp_settings (userid, twofactorenabled, nextreminder)
      VALUES (?, 'false', NULL)
    `;
        await apiPost(insertSettingsQuery, [userId.toString()]);

        return new Response(
            JSON.stringify({ message: "User registered successfully" }),
            { status: 201, headers: { "Content-Type": "application/json" } }
        );
    } catch (err: unknown) {
        console.error("Error registering user:", err);
        return new Response(
            JSON.stringify({ message: "Internal server error" }),
            { status: 500, headers: { "Content-Type": "application/json" } }
        );
    }
}
