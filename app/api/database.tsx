import path from "path";
import sqlite3 from "sqlite3";

const dbPath = path.join(process.cwd(), "profile.db");
export const db = new sqlite3.Database(
    dbPath,
    sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE,
    (err) => {
        if (err) {
            console.error(err.message);
        }
        console.log("Connected to the profile database.");
    }
);
