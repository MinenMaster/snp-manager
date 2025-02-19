import { db } from "./database";

export const migrate = () => {
    db.serialize(() => {
        db.run(
            `
            CREATE TABLE IF NOT EXISTS snp_users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username VARCHAR(255) NOT NULL UNIQUE,
                hashed_password VARCHAR(255) NOT NULL,
                email VARCHAR(255) NOT NULL UNIQUE,
                createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                lastLogin TIMESTAMP
            );
            `,
            (err: Error) => {
                if (err) {
                    console.error(err.message);
                }
                console.log("snp_users table created successfully.");
            }
        );

        db.run(
            `
            CREATE TABLE IF NOT EXISTS snp_login_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username VARCHAR(255) NOT NULL,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            `,
            (err: Error) => {
                if (err) {
                    console.error(err.message);
                }
                console.log("snp_login_logs table created successfully.");
            }
        );

        db.run(
            `
            CREATE TABLE IF NOT EXISTS snp_settings (
                userId INT NOT NULL REFERENCES snp_users(id) ON DELETE CASCADE,
                twoFactorEnabled BOOLEAN DEFAULT FALSE,
                nextReminder TIMESTAMP,
                PRIMARY KEY (userId)
            );
            `,
            (err: Error) => {
                if (err) {
                    console.error(err.message);
                }
                console.log("snp_settings table created successfully.");
            }
        );

        db.run(
            `
            CREATE TABLE IF NOT EXISTS snp_categories (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                userId INT NOT NULL REFERENCES snp_users(id) ON DELETE CASCADE,
                name VARCHAR(255) NOT NULL
            );
            `,
            (err: Error) => {
                if (err) {
                    console.error(err.message);
                }
                console.log("snp_categories table created successfully.");
            }
        );

        db.run(
            `
            CREATE TABLE IF NOT EXISTS snp_passwords (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                userId INT NOT NULL REFERENCES snp_users(id) ON DELETE CASCADE,
                categoryId INT REFERENCES snp_categories(id) ON DELETE SET NULL,
                title VARCHAR(255) NOT NULL,
                username VARCHAR(255),
                password VARCHAR(255) NOT NULL,
                url VARCHAR(255),
                notes VARCHAR(255),
                createdAt TIMESTAMP,
                lastUpdatedAt TIMESTAMP
            );
            `,
            (err: Error) => {
                if (err) {
                    console.error(err.message);
                }
                console.log("snp_passwords table created successfully.");
            }
        );
    });
};

// Note: This was added so it would be executed with the 'npm run migrate' command.
migrate();
