import { apiGet, apiPost } from "../database";
import { getCurrentTimestampISO } from "../tools/timestamp";
import { authenticateJWT } from "../tools/authenticateJWT";

export async function GET(req: Request) {
    try {
        const user = authenticateJWT(req);
        // Retrieve user id
        const userRows: any = await apiGet(
            `SELECT id FROM snp_users WHERE username = '${user.username}'`
        );
        if (!userRows || userRows.length === 0) {
            return new Response(JSON.stringify({ message: "User not found" }), {
                status: 404,
                headers: { "Content-Type": "application/json" },
            });
        }
        const userId = userRows[0].id;
        // Retrieve the passwords for the user
        const passwordRows: any = await apiGet(
            `SELECT id, title, username, password, url, notes, createdAt, lastUpdatedAt, categoryId 
       FROM snp_passwords WHERE userId = '${userId}'`
        );
        // Decrypt each password
        const { decrypt } = await import("../tools/encryption");
        const decryptedRows = (passwordRows as any[]).map((row) => ({
            ...row,
            password: decrypt(row.password),
        }));
        return new Response(JSON.stringify(decryptedRows), {
            status: 200,
            headers: { "Content-Type": "application/json" },
        });
    } catch (err: any) {
        console.error("Error fetching passwords:", err);
        return new Response(
            JSON.stringify({ message: "Internal server error" }),
            { status: 500, headers: { "Content-Type": "application/json" } }
        );
    }
}

export async function POST(req: Request) {
    try {
        const user = authenticateJWT(req);
        const {
            title,
            username: pwdUsername,
            password,
            url,
            notes,
            categoryId,
        } = await req.json();
        if (!title || !password) {
            return new Response(
                JSON.stringify({ message: "Title and password are required" }),
                { status: 400, headers: { "Content-Type": "application/json" } }
            );
        }
        // Retrieve user id
        const userRows: any = await apiGet(
            `SELECT id FROM snp_users WHERE username = '${user.username}'`
        );
        if (!userRows || userRows.length === 0) {
            return new Response(JSON.stringify({ message: "User not found" }), {
                status: 404,
                headers: { "Content-Type": "application/json" },
            });
        }
        const userId = userRows[0].id;
        // Encrypt the password
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
        return new Response(
            JSON.stringify({ message: "Password created successfully" }),
            { status: 201, headers: { "Content-Type": "application/json" } }
        );
    } catch (err: any) {
        console.error("Error creating password:", err);
        return new Response(
            JSON.stringify({ message: "Internal server error" }),
            { status: 500, headers: { "Content-Type": "application/json" } }
        );
    }
}
