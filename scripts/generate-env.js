const fs = require("fs");
const crypto = require("crypto");

const envFilePath = ".env";

if (fs.existsSync(envFilePath)) {
    console.log(`${envFilePath} already exists.`);
} else {
    const jwtSecret = crypto.randomBytes(32).toString("hex");
    const envContent = `JWT_SECRET="${jwtSecret}"\n`;
    fs.writeFileSync(envFilePath, envContent, { encoding: "utf8" });
    console.log(`${envFilePath} has been created with a new JWT_SECRET.`);
}
