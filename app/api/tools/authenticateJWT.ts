import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET as string;

export const authenticateJWT = (req: Request) => {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
        throw new Error("Unauthorized");
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
        throw new Error("Unauthorized");
    }

    try {
        const user = jwt.verify(token, JWT_SECRET);
        return user;
    } catch (error) {
        throw new Error("Forbidden");
    }
};
