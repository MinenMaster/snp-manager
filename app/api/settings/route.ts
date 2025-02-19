import { apiGet, apiPost } from "../database";
import { getCurrentTimestampISO } from "../tools/timestamp";
import { authenticateJWT } from "../tools/authenticateJWT";

export async function GET(req: Request) {
    try {
        const user = authenticateJWT(req);
        // Look up the user id based on username
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
        // Retrieve settings for the user
        const settingsRows: any = await apiGet(
            `SELECT twofactorenabled, nextreminder FROM snp_settings WHERE userid = '${userId}'`
        );
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
    } catch (err: any) {
        console.error("Error fetching settings:", err);
        return new Response(
            JSON.stringify({ message: "Internal server error" }),
            { status: 500, headers: { "Content-Type": "application/json" } }
        );
    }
}

export async function PUT(req: Request) {
    try {
        const user = authenticateJWT(req);
        const { twofactorenabled, nextreminder } = await req.json();
        // Validate input (you might add more checks as needed)
        if (twofactorenabled === undefined) {
            return new Response(
                JSON.stringify({ message: "twofactorenabled is required" }),
                { status: 400, headers: { "Content-Type": "application/json" } }
            );
        }
        // Retrieve the user's id
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
        // Update the settings (using a parameterized query)
        const updateQuery = `UPDATE snp_settings SET twofactorenabled = ?, nextreminder = ? WHERE userid = ?`;
        await apiPost(updateQuery, [
            twofactorenabled.toString(),
            nextreminder ? nextreminder : "",
            userId.toString(),
        ]);
        return new Response(
            JSON.stringify({ message: "Settings updated successfully" }),
            {
                status: 200,
                headers: { "Content-Type": "application/json" },
            }
        );
    } catch (err: any) {
        console.error("Error updating settings:", err);
        return new Response(
            JSON.stringify({ message: "Internal server error" }),
            { status: 500, headers: { "Content-Type": "application/json" } }
        );
    }
}
