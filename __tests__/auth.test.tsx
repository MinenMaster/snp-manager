import { NextRequest } from "next/server";
import jwt from "jsonwebtoken";
import { GET } from "../app/api/auth/route";
import dotenv from "dotenv";

dotenv.config({ path: "../.env.test" });

describe("GET /api/auth", () => {
    it("should return 200 and user object for valid token", async () => {
        const payload = { username: "testuser" };
        const token = jwt.sign(payload, process.env.JWT_SECRET as string);
        const req = new NextRequest("http://localhost/api/auth", {
            headers: { authorization: `Bearer ${token}` },
        });
        const res = await GET(req);
        expect(res.status).toBe(200);
        const data = await res.json();
        expect(data.username).toBe(payload.username);
    });

    it("should return 401 for missing authorization header", async () => {
        const req = new NextRequest("http://localhost/api/auth");
        const res = await GET(req);
        expect(res.status).toBe(401);
        const data = await res.json();
        expect(data.message).toBe("Unauthorized");
    });

    it("should return 401 for empty token in authorization header", async () => {
        const req = new NextRequest("http://localhost/api/auth", {
            headers: { authorization: "Bearer " },
        });
        const res = await GET(req);
        expect(res.status).toBe(401);
        const data = await res.json();
        expect(data.message).toBe("Unauthorized");
    });

    it("should return 401 for token that fails verification", async () => {
        const req = new NextRequest("http://localhost/api/auth", {
            headers: { authorization: "Bearer invalidtoken" },
        });
        const res = await GET(req);
        expect(res.status).toBe(403);
        const data = await res.json();
        expect(data.message).toBe("Forbidden");
    });
});
