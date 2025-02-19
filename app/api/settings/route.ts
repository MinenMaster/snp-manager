import { apiGet, apiPost } from "../database";
import { authenticateJWT } from "../tools/authenticateJWT";

interface UserRow {
    id: number;
}

interface SettingsRow {
    twofactorenabled: boolean;
    nextreminder: string | null;
}

export async function GET(req: Request): Promise<Response> {
    try {
        const user = authenticateJWT(req);
        const userRows = (await apiGet(
            `SELECT id FROM snp_users WHERE username = ?`,
            [user.username]
        )) as UserRow[];
        if (!userRows || userRows.length === 0) {
            return new Response(JSON.stringify({ message: "User not found" }), {
                status: 404,
                headers: { "Content-Type": "application/json" },
            });
        }
        const userId = userRows[0].id;
        const settingsRows = (await apiGet(
            `SELECT twofactorenabled, nextreminder FROM snp_settings WHERE userid = ?`,
            [userId.toString()]
        )) as SettingsRow[];
        if (!settingsRows || settingsRows.length === 0) {
            return new Response(
                JSON.stringify({ message: "Settings not found" }),
                {
                    status: 404,
                    headers: { "Content-Type": "application/json" },
                }
            );
        }
        return new Response(JSON.stringify(settingsRows[0]), {
            status: 200,
            headers: { "Content-Type": "application/json" },
        });
    } catch (err: unknown) {
        console.error("Error fetching settings:", err);
        return new Response(
            JSON.stringify({ message: "Internal server error" }),
            { status: 500, headers: { "Content-Type": "application/json" } }
        );
    }
}

export async function PUT(req: Request): Promise<Response> {
    try {
        const user = authenticateJWT(req);
        const { twofactorenabled, nextreminder } = await req.json();
        if (twofactorenabled === undefined) {
            return new Response(
                JSON.stringify({ message: "twofactorenabled is required" }),
                { status: 400, headers: { "Content-Type": "application/json" } }
            );
        }
        const userRows = (await apiGet(
            `SELECT id FROM snp_users WHERE username = ?`,
            [user.username]
        )) as UserRow[];
        if (!userRows || userRows.length === 0) {
            return new Response(JSON.stringify({ message: "User not found" }), {
                status: 404,
                headers: { "Content-Type": "application/json" },
            });
        }
        const userId = userRows[0].id;
        const updateQuery = `UPDATE snp_settings SET twofactorenabled = ?, nextreminder = ? WHERE userid = ?`;
        await apiPost(updateQuery, [
            twofactorenabled.toString(),
            nextreminder ? nextreminder : "",
            userId.toString(),
        ]);
        return new Response(
            JSON.stringify({ message: "Settings updated successfully" }),
            { status: 200, headers: { "Content-Type": "application/json" } }
        );
    } catch (err: unknown) {
        console.error("Error updating settings:", err);
        return new Response(
            JSON.stringify({ message: "Internal server error" }),
            { status: 500, headers: { "Content-Type": "application/json" } }
        );
    }
}
