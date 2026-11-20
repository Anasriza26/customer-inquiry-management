import { pool } from "../db/pool.js";

export async function requireAuth(req, res, next) {
    const sessionUser = req.session?.user;

    if (!sessionUser) {
        return res.status(401).json({
            error: "Authentication required.",
        });
    }

    try {
        const result = await pool.query(
            `SELECT id, name, email, role, is_active
       FROM users
       WHERE id = $1`,
            [sessionUser.id],
        );

        const user = result.rows[0];

        if (!user || !user.is_active) {
            return req.session.destroy((error) => {
                if (error) {
                    console.error("Inactive session cleanup failed:", error.message);
                }

                res.clearCookie("inquiry.sid", {
                    httpOnly: true,
                    sameSite: "lax",
                    secure: process.env.NODE_ENV === "production",
                });

                return res.status(401).json({
                    error: "Session expired or account is inactive. Please sign in again.",
                });
            });
        }

        req.session.user = {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
        };

        return next();
    } catch (error) {
        console.error("Authentication check failed:", error.message);

        return res.status(503).json({
            error: "Unable to verify your account right now.",
        });
    }
}