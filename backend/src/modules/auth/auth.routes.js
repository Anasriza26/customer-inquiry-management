import { Router } from "express";
import bcrypt from "bcrypt";
import { z } from "zod";
import { pool } from "../../db/pool.js";
import { requireAuth } from "../../middleware/require-auth.js";

const router = Router();

const loginSchema = z.object({
    email: z.string().trim().email().transform((value) => value.toLowerCase()),
    password: z.string().min(1).max(72),
});

router.post("/login", async (req, res) => {
    const validation = loginSchema.safeParse(req.body);

    if (!validation.success) {
        return res.status(400).json({
            error: "Enter a valid email and password.",
        });
    }

    const { email, password } = validation.data;

    try {
        const result = await pool.query(
            `SELECT id, name, email, password_hash, role, is_active
       FROM users
       WHERE email = $1`,
            [email],
        );

        const user = result.rows[0];

        if (!user || !user.is_active) {
            return res.status(401).json({
                error: "Email or password is incorrect.",
            });
        }

        const passwordMatches = await bcrypt.compare(
            password,
            user.password_hash,
        );

        if (!passwordMatches) {
            return res.status(401).json({
                error: "Email or password is incorrect.",
            });
        }

        await new Promise((resolve, reject) => {
            req.session.regenerate((error) => {
                if (error) reject(error);
                else resolve();
            });
        });

        req.session.user = {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
        };

        await new Promise((resolve, reject) => {
            req.session.save((error) => {
                if (error) reject(error);
                else resolve();
            });
        });

        return res.json({
            user: req.session.user,
        });
    } catch (error) {
        console.error("Login failed:", error.message);

        return res.status(500).json({
            error: "Unable to sign in right now.",
        });
    }
});

router.get("/me", requireAuth, (req, res) => {
    res.json({
        user: req.session.user,
    });
});

router.post("/logout", (req, res) => {
    if (!req.session) {
        return res.sendStatus(204);
    }

    req.session.destroy((error) => {
        if (error) {
            console.error("Logout failed:", error.message);

            return res.status(500).json({
                error: "Unable to sign out right now.",
            });
        }

        res.clearCookie("inquiry.sid", {
            httpOnly: true,
            sameSite: "lax",
            secure: process.env.NODE_ENV === "production",
        });

        return res.sendStatus(204);
    });
});

export default router;