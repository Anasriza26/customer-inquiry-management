import "dotenv/config";
import bcrypt from "bcrypt";
import { pool } from "../db/pool.js";

async function main() {
    const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
    const password = process.env.ADMIN_PASSWORD;

    if (!email || !password || password.length < 12) {
        throw new Error("Set a valid ADMIN_EMAIL and a 12+ character ADMIN_PASSWORD in backend/.env.");
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const result = await pool.query(
        `UPDATE users
     SET password_hash = $1, updated_at = NOW()
     WHERE LOWER(email) = $2 AND role = 'admin' AND is_active = TRUE
     RETURNING id`,
        [passwordHash, email],
    );

    if (result.rowCount !== 1) {
        throw new Error("Active admin account was not found; password was not updated.");
    }

    console.log("Admin password updated. The password was not printed.");
}

try {
    await main();
} catch (error) {
    console.error("Password reset failed:", error.message);
    process.exitCode = 1;
} finally {
    await pool.end();
}