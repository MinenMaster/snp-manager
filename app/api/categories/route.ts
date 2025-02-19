import { apiGet, apiPost } from "../database";
import { authenticateJWT } from "../tools/authenticateJWT";

interface UserRow {
    id: number;
    username: string;
}

interface CategoryRow {
    id: number;
    name: string;
    userId: number;
}

export async function GET(req: Request): Promise<Response> {
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

        const query = `SELECT id, name FROM snp_categories WHERE userId = ?`;
        const rows = (await apiGet(query, [
            userId.toString(),
        ])) as CategoryRow[];
        return new Response(JSON.stringify(rows || []), {
            status: 200,
            headers: { "Content-Type": "application/json" },
        });
    } catch (err: unknown) {
        console.error("Error fetching categories:", err);
        return new Response(
            JSON.stringify({ message: "Internal server error" }),
            { status: 500, headers: { "Content-Type": "application/json" } }
        );
    }
}

export async function POST(req: Request): Promise<Response> {
    try {
        const user = authenticateJWT(req);
        const { name } = await req.json();
        if (!name) {
            return new Response(
                JSON.stringify({ message: "Category name is required" }),
                { status: 400, headers: { "Content-Type": "application/json" } }
            );
        }
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

        const insertQuery = `INSERT INTO snp_categories (userId, name) VALUES (?, ?)`;
        await apiPost(insertQuery, [userId.toString(), name]);

        return new Response(
            JSON.stringify({ message: "Category created successfully" }),
            { status: 201, headers: { "Content-Type": "application/json" } }
        );
    } catch (err: unknown) {
        console.error("Error creating category:", err);
        return new Response(
            JSON.stringify({ message: "Internal server error" }),
            { status: 500, headers: { "Content-Type": "application/json" } }
        );
    }
}
