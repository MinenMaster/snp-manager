import { NextRequest, NextResponse } from "next/server";
import { authenticateJWT } from "../tools/authenticateJWT";

export async function GET(req: NextRequest): Promise<NextResponse> {
    try {
        const user = authenticateJWT(req);
        if (user instanceof NextResponse) {
            return user;
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
