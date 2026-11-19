import "dotenv/config";
import bcrypt from "bcrypt";
import { pool } from "../db/pool.js";

async function main() {
    const name = process.env.ADMIN_NAME;
    const email = process.env.ADMIN_EMAIL?.toLowerCase().trim();
    const password = process.env.ADMIN_PASSWORD;

    if (!name || !email || !password) {
        throw new Error(
            "Set ADMIN_NAME, ADMIN_EMAIL, and ADMIN_PASSWORD in backend/.env.",
        );
    }

    if (password.length < 8) {
        throw new Error("ADMIN_PASSWORD must be at least 8 characters long.");
    }

    const existing = await pool.query(
        "SELECT id FROM users WHERE email = $1",
        [email],
    );

    if (existing.rowCount > 0) {
        console.log("An account with this email already exists. No changes made.");
        return;
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const result = await pool.query(
        `INSERT INTO users (name, email, password_hash, role)
     VALUES ($1, $2, $3, 'admin')
     RETURNING id, name, email, role, is_active`,
        [name, email, passwordHash],
    );

    console.log("Admin account created:");
    console.log(result.rows[0]);
}

try {
    await main();
} catch (error) {
    console.error("Admin seed failed:", error.message);
    process.exitCode = 1;
} finally {
    await pool.end();
}