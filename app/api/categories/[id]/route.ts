import { NextRequest, NextResponse } from "next/server";
import { apiGet, apiPut, apiDelete } from "../../database";
import { authenticateJWT } from "../../tools/authenticateJWT";

interface UserRow {
    id: number;
    username: string;
}

interface CategoryRow {
    id: number;
    name: string;
    userId: number;
}

export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
    const { id } = await params;
    try {
        const user = authenticateJWT(req);
        if (typeof user === "string" || !("username" in user)) {
            return new NextResponse(
                JSON.stringify({ message: "Invalid user token" }),
                { status: 401, headers: { "Content-Type": "application/json" } }
            );
        }

        const { name, pinned } = await req.json();
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
                { status: 404, headers: { "Content-Type": "application/json" } }
            );
        }
        const userId = userRows[0].id;

        const categoryQuery = `SELECT * FROM snp_categories WHERE id = ? AND userId = ?`;
        const categoryRows = (await apiGet(categoryQuery, [
            id,
            userId.toString(),
        ])) as CategoryRow[];
        if (!categoryRows || categoryRows.length === 0) {
            return new NextResponse(
                JSON.stringify({ message: "Category not found" }),
                { status: 404, headers: { "Content-Type": "application/json" } }
            );
        }

        if (name === undefined && pinned === undefined) {
          return new NextResponse(
            JSON.stringify({ message: "Nothing to update" }),
            { status: 400, headers: { "Content-Type": "application/json" } }
          );
        }

        const updateQuery =
          "UPDATE snp_categories SET name = COALESCE(?, name), pinned = COALESCE(?, pinned) WHERE id = ? AND userId = ?";
        await apiPut(updateQuery, [name, pinned, id, userId.toString()]);

        return new NextResponse(
            JSON.stringify({ message: "Category updated successfully" }),
            { status: 200, headers: { "Content-Type": "application/json" } }
        );
    } catch (err: unknown) {
        console.error("Error updating category:", err);
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

        const categoryQuery = `SELECT * FROM snp_categories WHERE id = ? AND userId = ?`;
        const categoryRows = (await apiGet(categoryQuery, [
            id,
            userId.toString(),
        ])) as CategoryRow[];
        if (!categoryRows || categoryRows.length === 0) {
            return new NextResponse(
                JSON.stringify({ message: "Category not found" }),
                { status: 404, headers: { "Content-Type": "application/json" } }
            );
        }

        const deleteQuery = `DELETE FROM snp_categories WHERE id = ? AND userId = ?`;
        await apiDelete(deleteQuery, [id, userId.toString()]);

        return new NextResponse(
            JSON.stringify({ message: "Category deleted successfully" }),
            { status: 200, headers: { "Content-Type": "application/json" } }
        );
    } catch (err: unknown) {
        console.error("Error deleting category:", err);
        return new NextResponse(
            JSON.stringify({ message: "Internal server error" }),
            { status: 500, headers: { "Content-Type": "application/json" } }
        );
    }
}
