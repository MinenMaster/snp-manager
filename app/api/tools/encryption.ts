import crypto from "node:crypto";

const ENCRYPTION_KEY = Buffer.from(process.env.ENCRYPTION_KEY || "", "base64");
const IV_LENGTH = 16; // AES requires an IV of 16 bytes

export const encrypt = (text: string): string => {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv("aes-256-cbc", ENCRYPTION_KEY, iv);
    let encrypted = cipher.update(text, "utf8", "base64");
    encrypted += cipher.final("base64");
    return `${iv.toString("base64")}:${encrypted}`;
};

export const decrypt = (encryptedText: string): string => {
    const [iv, encrypted] = encryptedText.split(":");
    const decipher = crypto.createDecipheriv(
        "aes-256-cbc",
        ENCRYPTION_KEY,
        Buffer.from(iv, "base64")
    );
    let decrypted = decipher.update(encrypted, "base64", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
};
