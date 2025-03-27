const fs = require("fs");
const crypto = require("crypto");

const envFilePath = ".env";

if (fs.existsSync(envFilePath)) {
    console.log(`${envFilePath} already exists.`);
} else {
    const jwtSecret = crypto.randomBytes(32).toString("hex");
    const encryptionSecret = crypto.randomBytes(32).toString("base64");
    const envContent = `JWT_SECRET="${jwtSecret}"\nENCRYPTION_SECRET="${encryptionSecret}"\n`;
    fs.writeFileSync(envFilePath, envContent, { encoding: "utf8" });
    console.log(`${envFilePath} has been created with a new JWT_SECRET and ENCRYPTION_SECRET.`);
}
