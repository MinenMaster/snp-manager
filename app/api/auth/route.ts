import { NextRequest, NextResponse } from "next/server";
import { authenticateJWT } from "../tools/authenticateJWT";

export async function GET(req: NextRequest): Promise<NextResponse> {
    try {
        const user = authenticateJWT(req);
        if (typeof user === "string" || !("username" in user)) {
            return new NextResponse(
                JSON.stringify({ message: "Invalid user token" }),
                { status: 401, headers: { "Content-Type": "application/json" } }
            );
        }

        return new NextResponse(JSON.stringify(user), {
            status: 200,
            headers: { "Content-Type": "application/json" },
        });
    } catch (err: unknown) {
        console.error("Error fetching auth:", err);
        return new NextResponse(
            JSON.stringify({ message: "Internal server error" }),
            { status: 500, headers: { "Content-Type": "application/json" } }
        );
    }
}
