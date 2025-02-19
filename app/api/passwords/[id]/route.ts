import { apiGet, apiPost, apiDelete } from "../../database";
import { getCurrentTimestampISO } from "../../tools/timestamp";
import { authenticateJWT } from "../../tools/authenticateJWT";

export async function PUT(
    req: Request,
    { params }: { params: { id: string } }
) {
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
        const passRows: any = await apiGet(
            `SELECT * FROM snp_passwords WHERE id = '${params.id}' AND userId = '${userId}'`
        );
        if (!passRows || passRows.length === 0) {
            return new Response(
                JSON.stringify({ message: "Password not found" }),
                {
                    status: 404,
                    headers: { "Content-Type": "application/json" },
                }
            );
        }
        let encryptedPassword;
        if (password) {
            const { encrypt } = await import("../../tools/encryption");
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
        const updatedRows: any = await apiGet(
            `SELECT * FROM snp_passwords WHERE id = '${params.id}' AND userId = '${userId}'`
        );
        const { decrypt } = await import("../../tools/encryption");
        const decryptedRows = (updatedRows as any[]).map((row) => ({
            ...row,
            password: decrypt(row.password),
        }));
        return new Response(JSON.stringify(decryptedRows), {
            status: 200,
            headers: { "Content-Type": "application/json" },
        });
    } catch (err: any) {
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
) {
    try {
        const user = authenticateJWT(req);
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
        const passRows: any = await apiGet(
            `SELECT * FROM snp_passwords WHERE id = '${params.id}' AND userId = '${userId}'`
        );
        if (!passRows || passRows.length === 0) {
            return new Response(
                JSON.stringify({ message: "Password not found" }),
                {
                    status: 404,
                    headers: { "Content-Type": "application/json" },
                }
            );
        }
        const deleteQuery = `DELETE FROM snp_passwords WHERE id = ? AND userId = ?`;
        await apiDelete(deleteQuery, [params.id, userId.toString()]);
        return new Response(
            JSON.stringify({ message: "Password deleted successfully" }),
            { status: 200, headers: { "Content-Type": "application/json" } }
        );
    } catch (err: any) {
        console.error("Error deleting password:", err);
        return new Response(
            JSON.stringify({ message: "Internal server error" }),
            { status: 500, headers: { "Content-Type": "application/json" } }
        );
    }
}
