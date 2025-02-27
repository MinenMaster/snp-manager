import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET as string;

export const authenticateJWT = (req: NextRequest) => {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
        throw new Error("Unauthorized");
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
        return new NextResponse("Unauthorized", {
            status: 401,
            headers: { "Content-Type": "application/json" },
        });
    }

    try {
        const user = jwt.verify(token, JWT_SECRET);
        return user;
    } catch {
        return new NextResponse("Forbidden", {
            status: 403,
            headers: { "Content-Type": "application/json" },
        });
    }
};
