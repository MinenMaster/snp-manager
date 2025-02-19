import { apiGet, apiPost, apiDelete } from "../../database";
import { getCurrentTimestampISO } from "../../tools/timestamp";
import { authenticateJWT } from "../../tools/authenticateJWT";
import { encrypt, decrypt } from "../../tools/encryption";

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

export async function PUT(
    req: Request,
    { params }: { params: { id: string } }
): Promise<Response> {
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

        const userIdQuery = `SELECT id FROM snp_users WHERE username = ?`;
        const userRows = (await apiGet(userIdQuery, [
            user.username,
        ])) as UserRow[];
        if (!userRows || userRows.length === 0) {
            return new Response(JSON.stringify({ message: "User not found" }), {
                status: 404,
                headers: { "Content-Type": "application/json" },
            });
        }
        const userId = userRows[0].id;

        const passQuery = `SELECT * FROM snp_passwords WHERE id = ? AND userId = ?`;
        const passRows = (await apiGet(passQuery, [
            params.id,
            userId.toString(),
        ])) as PasswordRow[];
        if (!passRows || passRows.length === 0) {
            return new Response(
                JSON.stringify({ message: "Password not found" }),
                { status: 404, headers: { "Content-Type": "application/json" } }
            );
        }

        let encryptedPassword: string | null = null;
        if (password) {
            encryptedPassword = encrypt(password);
        }
        const lastUpdatedAt = getCurrentTimestampISO();
        const updateQuery = `
      UPDATE snp_passwords
      SET title = COALESCE(?, title),
          username = COALESCE(?, username),
          password = COALESCE(?, password),
          url = COALESCE(?, url),
          notes = COALESCE(?, notes),
          categoryId = COALESCE(?, categoryId),
          lastUpdatedAt = ?
      WHERE id = ? AND userId = ?
    `;
        await apiPost(updateQuery, [
            title || null,
            pwdUsername || null,
            encryptedPassword || null,
            url || null,
            notes || null,
            categoryId || null,
            lastUpdatedAt,
            params.id,
            userId.toString(),
        ]);

        const updatedQuery = `SELECT * FROM snp_passwords WHERE id = ? AND userId = ?`;
        const updatedRows = (await apiGet(updatedQuery, [
            params.id,
            userId.toString(),
        ])) as PasswordRow[];
        const decryptedRows = updatedRows.map((row) => ({
            ...row,
            password: decrypt(row.password),
        }));
        return new Response(JSON.stringify(decryptedRows), {
            status: 200,
            headers: { "Content-Type": "application/json" },
        });
    } catch (err: unknown) {
        console.error("Error updating password:", err);
        return new Response(
            JSON.stringify({ message: "Internal server error" }),
            { status: 500, headers: { "Content-Type": "application/json" } }
        );
    }
}

export async function DELETE(
    req: Request,
    { params }: { params: { id: string } }
): Promise<Response> {
    try {
        const user = authenticateJWT(req);
        const userIdQuery = `SELECT id FROM snp_users WHERE username = ?`;
        const userRows = (await apiGet(userIdQuery, [
            user.username,
        ])) as UserRow[];
        if (!userRows || userRows.length === 0) {
            return new Response(JSON.stringify({ message: "User not found" }), {
                status: 404,
                headers: { "Content-Type": "application/json" },
            });
        }
        const userId = userRows[0].id;

        const passQuery = `SELECT * FROM snp_passwords WHERE id = ? AND userId = ?`;
        const passRows = (await apiGet(passQuery, [
            params.id,
            userId.toString(),
        ])) as PasswordRow[];
        if (!passRows || passRows.length === 0) {
            return new Response(
                JSON.stringify({ message: "Password not found" }),
                { status: 404, headers: { "Content-Type": "application/json" } }
            );
        }

        const deleteQuery = `DELETE FROM snp_passwords WHERE id = ? AND userId = ?`;
        await apiDelete(deleteQuery, [params.id, userId.toString()]);

        return new Response(
            JSON.stringify({ message: "Password deleted successfully" }),
            { status: 200, headers: { "Content-Type": "application/json" } }
        );
    } catch (err: unknown) {
        console.error("Error deleting password:", err);
        return new Response(
            JSON.stringify({ message: "Internal server error" }),
            { status: 500, headers: { "Content-Type": "application/json" } }
        );
    }
}
