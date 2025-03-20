import { NextRequest, NextResponse } from "next/server";
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

export async function GET(req: NextRequest): Promise<NextResponse> {
    try {
        const user = authenticateJWT(req);
        if (typeof user === "string" || !("username" in user)) {
            return new NextResponse(
                JSON.stringify({ message: "Invalid user token" }),
                { status: 401, headers: { "Content-Type": "application/json" } }
            );
        }

        const userIdQuery = `SELECT id FROM snp_users WHERE username = ?`;
        const userRows = (await apiGet(userIdQuery, [
            user.username,
        ])) as UserRow[];
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

        const query = "SELECT id, name, pinned FROM snp_categories WHERE userId = ?";

        const rows = (await apiGet(query, [
            userId.toString(),
        ])) as CategoryRow[];
        return new NextResponse(JSON.stringify(rows || []), {
            status: 200,
            headers: { "Content-Type": "application/json" },
        });
    } catch (err: unknown) {
        console.error("Error fetching categories:", err);
        return new NextResponse(
            JSON.stringify({ message: "Internal server error" }),
            { status: 500, headers: { "Content-Type": "application/json" } }
        );
    }
}

export async function POST(req: NextRequest): Promise<NextResponse> {
    try {
        const user = authenticateJWT(req);
        if (typeof user === "string" || !("username" in user)) {
            return new NextResponse(
                JSON.stringify({ message: "Invalid user token" }),
                { status: 401, headers: { "Content-Type": "application/json" } }
            );
        }

        const { name, pinned = false } = await req.json();
        if (!name) {
            return new NextResponse(
                JSON.stringify({ message: "Category name is required" }),
                { status: 400, headers: { "Content-Type": "application/json" } }
            );
        }
        const userIdQuery = `SELECT id FROM snp_users WHERE username = ?`;
        const userRows = (await apiGet(userIdQuery, [
            user.username,
        ])) as UserRow[];
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

        const insertQuery =
          "INSERT INTO snp_categories (userId, name, pinned) VALUES (?, ?, ?)";
        await apiPost(insertQuery, [
          userId.toString(),
          name,
          pinned.toString(),
        ]);

        return new NextResponse(
            JSON.stringify({ message: "Category created successfully" }),
            { status: 201, headers: { "Content-Type": "application/json" } }
        );
    } catch (err: unknown) {
        console.error("Error creating category:", err);
        return new NextResponse(
            JSON.stringify({ message: "Internal server error" }),
            { status: 500, headers: { "Content-Type": "application/json" } }
        );
    }
}
