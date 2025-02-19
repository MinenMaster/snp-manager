import bcrypt from "bcryptjs";
import { getCurrentTimestampISO } from "../tools/timestamp";
import { apiGet, apiPost } from "../database";

export async function POST(req: Request) {
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

        // Check for existing user
        const existingUserQuery = `SELECT * FROM snp_users WHERE username = '${username}' OR email = '${email}'`;
        const existingUsers: any = await apiGet(existingUserQuery);
        if (existingUsers.length > 0) {
            return new Response(
                JSON.stringify({ message: "Username or email already exists" }),
                { status: 400, headers: { "Content-Type": "application/json" } }
            );
        }

        // Hash the password and get current timestamp
        const hashedPassword = await bcrypt.hash(password, 10);
        const createdAt = getCurrentTimestampISO();

        // Insert the new user
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

        // Retrieve the inserted user's id
        const userIdQuery = `SELECT id FROM snp_users WHERE username = '${username}'`;
        const userRows: any = await apiGet(userIdQuery);
        if (!userRows || userRows.length === 0) {
            return new Response(
                JSON.stringify({
                    message: "User not found after registration",
                }),
                { status: 500, headers: { "Content-Type": "application/json" } }
            );
        }
        const userId = userRows[0].id;

        // Create default settings for the new user
        const insertSettingsQuery = `
      INSERT INTO snp_settings (userid, twofactorenabled, nextreminder)
      VALUES (?, 'false', NULL)
    `;
        await apiPost(insertSettingsQuery, [userId.toString()]);

        return new Response(
            JSON.stringify({ message: "User registered successfully" }),
            { status: 201, headers: { "Content-Type": "application/json" } }
        );
    } catch (err: any) {
        console.error("Error registering user:", err);
        return new Response(
            JSON.stringify({ message: "Internal server error" }),
            { status: 500, headers: { "Content-Type": "application/json" } }
        );
    }
}
