import { NextRequest } from "next/server";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { GET, POST } from "../app/api/passwords/route";
import { PUT, DELETE } from "../app/api/passwords/[id]/route";
import { apiGet, apiPost, apiPut, apiDelete } from "../app/api/database";
import { encrypt } from "@/app/api/tools/encryption";

dotenv.config({ path: "../.env.test" });

jest.mock("../app/api/database", () => ({
    apiGet: jest.fn(),
    apiPost: jest.fn(),
    apiPut: jest.fn(),
    apiDelete: jest.fn(),
}));

// nah glaub ich nicht das
//
// jest.mock("../app/api/passwords/route", () => ({
//     GET: jest.fn(),
//     POST: jest.fn(),
// }));

// jest.mock("../app/api/passwords/[id]/route", () => ({
//     PUT: jest.fn(),
//     DELETE: jest.fn(),
// }));

describe("POST /api/passwords", () => {
    it("should return 201 and created password record for valid token and valid input", async () => {
        // Set up the mocks:
        // When the POST endpoint tries to get the user id from the database,
        // it calls apiGet with a SELECT query. Here we simulate that it returns a user row.
        (apiGet as jest.Mock).mockResolvedValueOnce([
            { id: 1, username: "testuser" },
        ]);
        // Now simulate a successful insert. (Your code may call apiPost to insert the record)
        (apiPost as jest.Mock).mockResolvedValue([
            { message: "Password created successfully" },
        ]);
        // If your POST function returns additional data (for example, fetching back the inserted row),
        // you might need a second apiGet mock. E.g.,
        // (apiGet as jest.Mock).mockResolvedValueOnce([{ title: reqBody.title, ... }]);

        const payload = { username: "testuser" };
        const token = jwt.sign(payload, process.env.JWT_SECRET as string);
        const reqBody = {
            title: "Email Account",
            username: "user@example.com",
            password: "ValidPass!234",
            url: "https://mail.example.com",
            notes: "Important email account",
            categoryId: 2,
        };
        const req = new NextRequest("http://localhost/api/passwords", {
            method: "POST",
            headers: {
                authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(reqBody),
        });
        const res = await POST(req);
        expect(res.status).toBe(201);
        const data = await res.json();
        expect(data.message).toBe("Password created successfully");
    });

    it("should return 401 for missing authorization header on password creation", async () => {
        const reqBody = {
            title: "Email Account",
            username: "user@example.com",
            password: "ValidPass!234",
            url: "https://mail.example.com",
            notes: "Important email account",
            categoryId: 2,
        };
        const req = new NextRequest("http://localhost/api/passwords", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(reqBody),
        });
        const res = await POST(req);
        expect(res.status).toBe(401);
        const data = await res.json();
        expect(data.message).toBe("Unauthorized");
    });

    it("should return 400 for missing required fields on password creation", async () => {
        const payload = { username: "testuser" };
        const token = jwt.sign(payload, process.env.JWT_SECRET as string);
        // missing required title and password
        const reqBody = {
            username: "user@example.com",
            url: "https://mail.example.com",
            notes: "Important email account",
            categoryId: 2,
        };
        const req = new NextRequest("http://localhost/api/passwords", {
            method: "POST",
            headers: {
                authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(reqBody),
        });
        const res = await POST(req);
        expect(res.status).toBe(400);
        const data = await res.json();
        expect(data.message).toBe("Title and password are required");
    });
});

describe("PUT /api/passwords/:id", () => {
    it("should update a password record for valid token", async () => {
        // // mock category and password records
        // const payload = { username: "testuser" };
        // const token = jwt.sign(payload, process.env.JWT_SECRET as string);

        (apiGet as jest.Mock).mockResolvedValueOnce([
            { id: 1, username: "testuser" },
        ]);

        (apiGet as jest.Mock).mockResolvedValueOnce([
            {
                id: 1,
                title: "Password 1",
                username: "",
                password: "Password1!",
                url: "",
                notes: "",
                createdAt: "2025-01-01T00:00:00.000Z",
                lastUpdatedAt: "2025-01-01T00:00:00.000Z",
                categoryId: 1,
            },
            {
                id: 2,
                title: "Password 2",
                username: "",
                password: "Password2!",
                url: "",
                notes: "",
                createdAt: "2025-01-01T00:00:00.000Z",
                lastUpdatedAt: "2025-01-01T00:00:00.000Z",
                categoryId: 1,
            },
            {
                id: 3,
                title: "Password 3",
                username: "",
                password: "Password3!",
                url: "",
                notes: "",
                createdAt: "2025-01-01T00:00:00.000Z",
                lastUpdatedAt: "2025-01-01T00:00:00.000Z",
                categoryId: 1,
            },
        ]);

        (apiPut as jest.Mock).mockResolvedValue(null);

        (apiGet as jest.Mock).mockResolvedValueOnce([
            {
                id: 1,
                title: "Password 1",
                username: "",
                password: encrypt("Password1!"),
                url: "",
                notes: "",
                createdAt: "2025-01-01T00:00:00.000Z",
                lastUpdatedAt: "2025-01-01T00:00:00.000Z",
                categoryId: 1,
            },
            {
                id: 2,
                title: "Password 2",
                username: "",
                password: encrypt("Password2!"),
                url: "",
                notes: "",
                createdAt: "2025-01-01T00:00:00.000Z",
                lastUpdatedAt: "2025-01-01T00:00:00.000Z",
                categoryId: 1,
            },
            {
                id: 3,
                title: "Updated Title",
                username: "newuser@example.com",
                password: encrypt("NewValidPass!1"),
                url: "https://example.com",
                notes: "Updated notes",
                createdAt: "2025-01-01T00:00:00.000Z",
                lastUpdatedAt: "2025-01-01T00:00:00.000Z",
                categoryId: 1,
            },
        ]);

        // test
        const payload = { username: "testuser" };
        const token = jwt.sign(payload, process.env.JWT_SECRET as string);
        const passwordId = 3;
        const updateBody = {
            title: "Updated Title",
            username: "newuser@example.com",
            password: "NewValidPass!1",
            url: "https://example.com",
            notes: "Updated notes",
            categoryId: 1,
        };
        const req = new NextRequest(
            `http://localhost/api/passwords/${passwordId}`,
            {
                method: "PUT",
                headers: {
                    authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(updateBody),
            }
        );
        const res = await PUT(req, {
            params: Promise.resolve({ id: passwordId.toString() }),
        });
        expect(res.ok).toBe(true);
        const data = await res.json();
        expect(data[passwordId - 1].title).toBe(updateBody.title);
    });

    it("should return 401 on updating a password record without token", async () => {
        const passwordId = 3;
        const updateBody = {
            title: "Updated Title",
            username: "newuser@example.com",
            password: "NewValidPass!1",
            url: "https://example.com",
            notes: "Updated notes",
            categoryId: 1,
        };
        const req = new NextRequest(
            `http://localhost/api/passwords/${passwordId}`,
            {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(updateBody),
            }
        );
        const res = await PUT(req, {
            params: Promise.resolve({ id: passwordId.toString() }),
        });
        expect(res.status).toBe(401);
        const data = await res.json();
        expect(data.message).toBe("Unauthorized");
    });

    it("should return 403 on updating a password record with invalid token", async () => {
        const passwordId = 3;
        const updateBody = {
            title: "Updated Title",
            username: "newuser@example.com",
            password: "NewValidPass!1",
            url: "https://example.com",
            notes: "Updated notes",
            categoryId: 1,
        };
        const req = new NextRequest(
            `http://localhost/api/passwords/${passwordId}`,
            {
                method: "PUT",
                headers: {
                    authorization: "Bearer invalidtoken",
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(updateBody),
            }
        );
        const res = await PUT(req, {
            params: Promise.resolve({ id: passwordId.toString() }),
        });
        expect(res.status).toBe(403);
        const data = await res.json();
        expect(data.message).toBe("Forbidden");
    });
});

describe("DELETE /api/passwords/:id", () => {
    it("should delete a password record for valid token", async () => {
        // mock
        (apiGet as jest.Mock).mockResolvedValueOnce([
            { id: 1, username: "testuser" },
        ]);

        (apiGet as jest.Mock).mockResolvedValueOnce([
            {
                id: 1,
                title: "Password 1",
                username: "",
                password: "Password1!",
                url: "",
                notes: "",
                createdAt: "2025-01-01T00:00:00.000Z",
                lastUpdatedAt: "2025-01-01T00:00:00.000Z",
                categoryId: 1,
            },
            {
                id: 2,
                title: "Password 2",
                username: "",
                password: "Password2!",
                url: "",
                notes: "",
                createdAt: "2025-01-01T00:00:00.000Z",
                lastUpdatedAt: "2025-01-01T00:00:00.000Z",
                categoryId: 1,
            },
            {
                id: 3,
                title: "Password 3",
                username: "",
                password: "Password3!",
                url: "",
                notes: "",
                createdAt: "2025-01-01T00:00:00.000Z",
                lastUpdatedAt: "2025-01-01T00:00:00.000Z",
                categoryId: 1,
            },
        ]);

        (apiDelete as jest.Mock).mockResolvedValue(null);

        (apiGet as jest.Mock).mockResolvedValueOnce([
            { id: 1, username: "testuser" },
        ]);

        (apiGet as jest.Mock).mockResolvedValueOnce([
            {
                id: 1,
                title: "Password 1",
                username: "",
                password: encrypt("Password1!"),
                url: "",
                notes: "",
                createdAt: "2025-01-01T00:00:00.000Z",
                lastUpdatedAt: "2025-01-01T00:00:00.000Z",
                categoryId: 1,
            },
            {
                id: 3,
                title: "Password 3",
                username: "",
                password: encrypt("Password3!"),
                url: "",
                notes: "",
                createdAt: "2025-01-01T00:00:00.000Z",
                lastUpdatedAt: "2025-01-01T00:00:00.000Z",
                categoryId: 1,
            },
        ]);

        // test
        const payload = { username: "testuser" };
        const token = jwt.sign(payload, process.env.JWT_SECRET as string);
        const passwordId = 2;
        const req = new NextRequest(
            `http://localhost/api/passwords/${passwordId}`,
            {
                method: "DELETE",
                headers: { authorization: `Bearer ${token}` },
            }
        );
        const res = await DELETE(req, {
            params: Promise.resolve({ id: passwordId.toString() }),
        });
        expect(res.ok).toBe(true);
        const data = await res.json();
        expect(data.message).toBe("Password deleted successfully");

        // check if password record is deleted
        const getReq = new NextRequest(`http://localhost/api/passwords`, {
            method: "GET",
            headers: { authorization: `Bearer ${token}` },
        });
        const getRes = await GET(getReq);
        const passwords = await getRes.json();
        const deletedPassword = passwords.find(
            (password: { id: number }) => password.id === passwordId
        );
        expect(deletedPassword).toBeUndefined();
    });

    it("should return 401 on deleting a password record without token", async () => {
        const passwordId = 2;
        const req = new NextRequest(
            `http://localhost/api/passwords/${passwordId}`,
            {
                method: "DELETE",
            }
        );
        const res = await DELETE(req, {
            params: Promise.resolve({ id: passwordId.toString() }),
        });
        expect(res.status).toBe(401);
        const data = await res.json();
        expect(data.message).toBe("Unauthorized");
    });

    it("should return 403 on deleting a password record with invalid token", async () => {
        const passwordId = 2;
        const req = new NextRequest(
            `http://localhost/api/passwords/${passwordId}`,
            {
                method: "DELETE",
                headers: { authorization: "Bearer invalidtoken" },
            }
        );
        const res = await DELETE(req, {
            params: Promise.resolve({ id: passwordId.toString() }),
        });
        expect(res.status).toBe(403);
        const data = await res.json();
        expect(data.message).toBe("Forbidden");
    });

    it("should return 404 on deleting a non-existent password record", async () => {
        // mock
        (apiGet as jest.Mock).mockResolvedValueOnce([
            { id: 1, username: "testuser" },
        ]);

        (apiGet as jest.Mock).mockResolvedValueOnce([]);

        // test
        const payload = { username: "testuser" };
        const token = jwt.sign(payload, process.env.JWT_SECRET as string);
        const passwordId = 100;
        const req = new NextRequest(
            `http://localhost/api/passwords/${passwordId}`,
            {
                method: "DELETE",
                headers: { authorization: `Bearer ${token}` },
            }
        );
        const res = await DELETE(req, {
            params: Promise.resolve({ id: passwordId.toString() }),
        });
        expect(res.status).toBe(404);
        const data = await res.json();
        expect(data.message).toBe("Password not found");
    });
});
