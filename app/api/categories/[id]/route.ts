import { apiGet, apiPut, apiDelete } from "../../database";
import { authenticateJWT } from "../../tools/authenticateJWT";

export async function PUT(
    req: Request,
    { params }: { params: { id: string } }
) {
    try {
        const user = authenticateJWT(req);
        const { name } = await req.json();
        if (!name) {
            return new Response(
                JSON.stringify({ message: "Category name is required" }),
                { status: 400, headers: { "Content-Type": "application/json" } }
            );
        }

        const userIdQuery = `SELECT id FROM snp_users WHERE username = '${user.username}'`;
        const userRows: any = await apiGet(userIdQuery);
        if (!userRows || userRows.length === 0) {
            return new Response(JSON.stringify({ message: "User not found" }), {
                status: 404,
                headers: { "Content-Type": "application/json" },
            });
        }
        const userId = userRows[0].id;

        const categoryQuery = `SELECT * FROM snp_categories WHERE id = '${params.id}' AND userId = '${userId}'`;
        const categoryRows: any = await apiGet(categoryQuery);
        if (!categoryRows || categoryRows.length === 0) {
            return new Response(
                JSON.stringify({ message: "Category not found" }),
                { status: 404, headers: { "Content-Type": "application/json" } }
            );
        }

        const updateQuery = `UPDATE snp_categories SET name = ? WHERE id = ? AND userId = ?`;
        await apiPut(updateQuery, [name, params.id, userId.toString()]);

        return new Response(
            JSON.stringify({ message: "Category updated successfully" }),
            { status: 200, headers: { "Content-Type": "application/json" } }
        );
    } catch (err: any) {
        console.error("Error updating category:", err);
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
        const userIdQuery = `SELECT id FROM snp_users WHERE username = '${user.username}'`;
        const userRows: any = await apiGet(userIdQuery);
        if (!userRows || userRows.length === 0) {
            return new Response(JSON.stringify({ message: "User not found" }), {
                status: 404,
                headers: { "Content-Type": "application/json" },
            });
        }
        const userId = userRows[0].id;

        const categoryQuery = `SELECT * FROM snp_categories WHERE id = ? AND userId = ?`;
        const categoryRows: any = await apiGet(
            categoryQuery
                .replace("?", `'${params.id}'`)
                .replace("?", `'${userId}'`)
        );
        if (!categoryRows || categoryRows.length === 0) {
            return new Response(
                JSON.stringify({ message: "Category not found" }),
                { status: 404, headers: { "Content-Type": "application/json" } }
            );
        }

        const deleteQuery = `DELETE FROM snp_categories WHERE id = ? AND userId = ?`;
        await apiDelete(deleteQuery, [params.id, userId.toString()]);

        return new Response(
            JSON.stringify({ message: "Category deleted successfully" }),
            { status: 200, headers: { "Content-Type": "application/json" } }
        );
    } catch (err: any) {
        console.error("Error deleting category:", err);
        return new Response(
            JSON.stringify({ message: "Internal server error" }),
            { status: 500, headers: { "Content-Type": "application/json" } }
        );
    }
}
