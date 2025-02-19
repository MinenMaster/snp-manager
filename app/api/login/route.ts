import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import {
    getCurrentTimestampISO,
    getCurrentTimestampFormatted,
} from "../tools/timestamp";
import { apiGet, apiPost } from "../database";

const JWT_SECRET = process.env.JWT_SECRET as string;

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
        const { identifier, password } = await req.json();

        if (!identifier || !password) {
            return new Response(
                JSON.stringify({
                    message: "Identifier and password are required",
                }),
                {
                    status: 400,
                    headers: { "Content-Type": "application/json" },
                }
            );
        }

        // Use parameterized query for selecting user.
        const userQuery = `SELECT * FROM snp_users WHERE username = ? OR email = ?`;
        const users = (await apiGet(userQuery, [
            identifier,
            identifier,
        ])) as User[];
        if (!users || users.length === 0) {
            return new Response(
                JSON.stringify({ message: "Invalid credentials" }),
                {
                    status: 400,
                    headers: { "Content-Type": "application/json" },
                }
            );
        }
        const user = users[0];

        // Validate password.
        const validPassword = await bcrypt.compare(
            password,
            user.hashed_password
        );
        if (!validPassword) {
            return new Response(
                JSON.stringify({ message: "Invalid credentials" }),
                {
                    status: 400,
                    headers: { "Content-Type": "application/json" },
                }
            );
        }

        // Update last login timestamp.
        const currentTimestampISO = getCurrentTimestampISO();
        const updateLoginQuery = `UPDATE snp_users SET lastLogin = ? WHERE id = ?`;
        await apiPost(updateLoginQuery, [
            currentTimestampISO,
            user.id.toString(),
        ]);

        // Generate JWT token.
        const token = jwt.sign({ username: user.username }, JWT_SECRET, {
            expiresIn: "1h",
        });

        // Log login activity.
        const timestampFormatted = getCurrentTimestampFormatted();
        console.log(`[${timestampFormatted}] User ${user.username} logged in.`);
        const logQuery = `INSERT INTO snp_login_logs (username, timestamp) VALUES (?, ?)`;
        await apiPost(logQuery, [user.username, currentTimestampISO]);

        return new Response(JSON.stringify({ token }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
        });
    } catch (err: unknown) {
        console.error("Error logging in user:", err);
        return new Response(
            JSON.stringify({ message: "Internal server error" }),
            { status: 500, headers: { "Content-Type": "application/json" } }
        );
    }
}
