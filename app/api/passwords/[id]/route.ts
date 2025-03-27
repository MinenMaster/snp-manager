import { NextRequest, NextResponse } from "next/server";
import { apiGet, apiPut, apiDelete } from "../../database";
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
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
    const { id } = await params;
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

        const passQuery = `SELECT * FROM snp_passwords WHERE id = ? AND userId = ?`;
        const passRows = (await apiGet(passQuery, [
            id,
            userId.toString(),
        ])) as PasswordRow[];
        if (!passRows || passRows.length === 0) {
            return new NextResponse(
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
        await apiPut(updateQuery, [
            title || null,
            pwdUsername || null,
            encryptedPassword || null,
            url || null,
            notes || null,
            categoryId || null,
            lastUpdatedAt,
            id,
            userId.toString(),
        ]);

        const updatedQuery = `SELECT * FROM snp_passwords WHERE id = ? AND userId = ?`;
        const updatedRows = (await apiGet(updatedQuery, [
            id,
            userId.toString(),
        ])) as PasswordRow[];
        const decryptedRows = updatedRows.map((row) => ({
            ...row,
            password: decrypt(row.password),
        }));
        return new NextResponse(JSON.stringify(decryptedRows), {
            status: 200,
            headers: { "Content-Type": "application/json" },
        });
    } catch (err: unknown) {
        console.error("Error updating password:", err);
        return new NextResponse(
            JSON.stringify({ message: "Internal server error" }),
            { status: 500, headers: { "Content-Type": "application/json" } }
        );
    }
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
    const { id } = await params;
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

        const passQuery = `SELECT * FROM snp_passwords WHERE id = ? AND userId = ?`;
        const passRows = (await apiGet(passQuery, [
            id,
            userId.toString(),
        ])) as PasswordRow[];
        if (!passRows || passRows.length === 0) {
            return new NextResponse(
                JSON.stringify({ message: "Password not found" }),
                { status: 404, headers: { "Content-Type": "application/json" } }
            );
        }

        const deleteQuery = `DELETE FROM snp_passwords WHERE id = ? AND userId = ?`;
        await apiDelete(deleteQuery, [id, userId.toString()]);

        return new NextResponse(
            JSON.stringify({ message: "Password deleted successfully" }),
            { status: 200, headers: { "Content-Type": "application/json" } }
        );
    } catch (err: unknown) {
        console.error("Error deleting password:", err);
        return new NextResponse(
            JSON.stringify({ message: "Internal server error" }),
            { status: 500, headers: { "Content-Type": "application/json" } }
        );
    }
}
