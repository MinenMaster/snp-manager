import { NextRequest, NextResponse } from "next/server";
import { apiGet, apiPost } from "../database";
import { getCurrentTimestampISO } from "../tools/timestamp";
import { authenticateJWT } from "../tools/authenticateJWT";
import { decrypt } from "../tools/encryption";

interface UserRow {
    id: number;
    username: string;
}

interface PasswordRow {
    id: number;
    title: string;
    username: string;
    password: string;
    url: string;
    notes: string;
    createdAt: string;
    lastUpdatedAt?: string;
    categoryId?: number;
}

export async function GET(req: NextRequest): Promise<NextResponse> {
    try {
        const user = authenticateJWT(req);
        if (user instanceof NextResponse) {
            return user;
        }

        const userIdQuery = `SELECT id FROM snp_users WHERE username = ?`;
        const { username } = user as { username: string };
        const userRows = (await apiGet(userIdQuery, [username])) as UserRow[];
        if (!userRows || userRows.length === 0) {
            return new NextResponse(
                JSON.stringify({ message: "User not found" }),
                {
                    status: 404,
                    headers: { "Content-Type": "application/json" },
                }
            );
        }
        const userId = userRows[0].id;

        const passwordQuery = `
      SELECT id, title, username, password, url, notes, createdAt, lastUpdatedAt, categoryId 
      FROM snp_passwords WHERE userId = ?
    `;
        const passwordRows = (await apiGet(passwordQuery, [
            userId.toString(),
        ])) as PasswordRow[];

        const decryptedRows = passwordRows.map((row) => ({
            ...row,
            password: decrypt(row.password),
        }));

        return new NextResponse(JSON.stringify(decryptedRows), {
            status: 200,
            headers: { "Content-Type": "application/json" },
        });
    } catch (err: unknown) {
        console.error("Error fetching passwords:", err);
        return new NextResponse(
            JSON.stringify({ message: "Internal server error" }),
            { status: 500, headers: { "Content-Type": "application/json" } }
        );
    }
}

export async function POST(req: NextRequest): Promise<NextResponse> {
    try {
        const user = authenticateJWT(req);
        if (user instanceof NextResponse) {
            return user;
        }

        const {
            title,
            username: pwdUsername,
            password,
            url,
            notes,
            categoryId,
        } = await req.json();
        if (!title || !password) {
            return new NextResponse(
                JSON.stringify({ message: "Title and password are required" }),
                { status: 400, headers: { "Content-Type": "application/json" } }
            );
        }

        const userIdQuery = `SELECT id FROM snp_users WHERE username = ?`;
        const { username } = user as { username: string };
        const userRows = (await apiGet(userIdQuery, [username])) as UserRow[];
        if (!userRows || userRows.length === 0) {
            return new NextResponse(
                JSON.stringify({ message: "User not found" }),
                {
                    status: 404,
                    headers: { "Content-Type": "application/json" },
                }
            );
        }
        const userId = userRows[0].id;

        const { encrypt } = await import("../tools/encryption");
        const encryptedPassword = encrypt(password);
        const createdAt = getCurrentTimestampISO();

        const insertQuery = `
      INSERT INTO snp_passwords (userId, title, username, password, url, notes, categoryId, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
        await apiPost(insertQuery, [
            userId.toString(),
            title,
            pwdUsername || "",
            encryptedPassword,
            url || "",
            notes || "",
            categoryId ? categoryId.toString() : "",
            createdAt,
        ]);

        return new NextResponse(
            JSON.stringify({ message: "Password created successfully" }),
            { status: 201, headers: { "Content-Type": "application/json" } }
        );
    } catch (err: unknown) {
        console.error("Error creating password:", err);
        return new NextResponse(
            JSON.stringify({ message: "Internal server error" }),
            { status: 500, headers: { "Content-Type": "application/json" } }
        );
    }
}
