import crypto from "node:crypto";

const IV_LENGTH = 12; // AES-GCM recommends a 12-byte IV
const KEY_LENGTH = 32; // 256-bit key

// Derive a strong key from an environment variable
const deriveKey = (secret: string): Buffer => {
    return crypto.pbkdf2Sync(
        secret,
        "salt-value",
        100000,
        KEY_LENGTH,
        "sha256"
    );
};

if (!process.env.ENCRYPTION_SECRET) {
    throw new Error("Missing ENCRYPTION_SECRET in environment variables.");
}

const ENCRYPTION_KEY = deriveKey(process.env.ENCRYPTION_SECRET);

export const encrypt = (text: string): string => {
    if (!text) throw new Error("No text provided for encryption");

    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv("aes-256-gcm", ENCRYPTION_KEY, iv);

    let encrypted = cipher.update(text, "utf8", "base64");
    encrypted += cipher.final("base64");

    const authTag = cipher.getAuthTag().toString("base64");

    return `${iv.toString("base64")}:${authTag}:${encrypted}`;
};

export const decrypt = (encryptedText: string): string => {
    const parts = encryptedText.split(":");
    if (parts.length !== 3) throw new Error("Invalid encrypted text format");

    const [iv, authTag, encrypted] = parts;

    const decipher = crypto.createDecipheriv(
        "aes-256-gcm",
        ENCRYPTION_KEY,
        Buffer.from(iv, "base64")
    );

    decipher.setAuthTag(Buffer.from(authTag, "base64"));

    let decrypted = decipher.update(encrypted, "base64", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
};
