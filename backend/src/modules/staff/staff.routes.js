import { Router } from "express";
import bcrypt from "bcrypt";
import { z } from "zod";
import { pool } from "../../db/pool.js";
import { requireAuth } from "../../middleware/require-auth.js";
import { requireRole } from "../../middleware/require-role.js";

const router = Router();

const createStaffSchema = z.object({
    name: z.string().trim().min(1).max(120),
    email: z
        .string()
        .trim()
        .email()
        .max(255)
        .transform((value) => value.toLowerCase()),
    password: z.string().min(8).max(72),
});

const updateStaffSchema = z
    .object({
        name: z.string().trim().min(1).max(120).optional(),
        email: z
            .string()
            .trim()
            .email()
            .max(255)
            .transform((value) => value.toLowerCase())
            .optional(),
    })
    .strict();

const activeSchema = z.object({
    isActive: z.boolean(),
});

function validStaffId(value) {
    const id = Number(value);
    return Number.isInteger(id) && id > 0 ? id : null;
}

// Login and admin role are mandatory for all staff-management routes.
router.use(requireAuth, requireRole("admin"));

// Staff list — password_hash is not included in the response.
router.get("/", async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT id, name, email, role, is_active, created_at, updated_at
       FROM users
       WHERE role = 'staff'
       ORDER BY name ASC`,
        );

        return res.json({ staff: result.rows });
    } catch (error) {
        console.error("Staff list failed:", error.message);

        return res.status(500).json({
            error: "Unable to load staff accounts.",
        });
    }
});

// Create a new Staff account.
router.post("/", async (req, res) => {
    const parsed = createStaffSchema.safeParse(req.body);

    if (!parsed.success) {
        return res.status(400).json({
            error: "Check the staff name, email, and password.",
            details: parsed.error.flatten().fieldErrors,
        });
    }

    const { name, email, password } = parsed.data;

    try {
        const passwordHash = await bcrypt.hash(password, 12);

        const result = await pool.query(
            `INSERT INTO users (name, email, password_hash, role)
       VALUES ($1, $2, $3, 'staff')
       RETURNING id, name, email, role, is_active, created_at, updated_at`,
            [name, email, passwordHash],
        );

        return res.status(201).json({ staff: result.rows[0] });
    } catch (error) {
        if (error.code === "23505") {
            return res.status(409).json({
                error: "An account with this email already exists.",
            });
        }

        console.error("Staff creation failed:", error.message);

        return res.status(500).json({
            error: "Unable to create the staff account.",
        });
    }
});

// Staff பெயர் அல்லது email-ஐ மாற்றுதல்.
router.patch("/:id", async (req, res) => {
    const id = validStaffId(req.params.id);
    const parsed = updateStaffSchema.safeParse(req.body);

    if (!id) {
        return res.status(400).json({ error: "Invalid staff ID." });
    }

    if (!parsed.success || Object.keys(parsed.data ?? {}).length === 0) {
        return res.status(400).json({
            error: "Provide a valid staff name or email to update.",
            details: parsed.success
                ? undefined
                : parsed.error.flatten().fieldErrors,
        });
    }

    const fields = [];
    const values = [];

    if (parsed.data.name !== undefined) {
        values.push(parsed.data.name);
        fields.push(`name = $${values.length}`);
    }

    if (parsed.data.email !== undefined) {
        values.push(parsed.data.email);
        fields.push(`email = $${values.length}`);
    }

    values.push(id);
    const idPosition = values.length;

    try {
        const result = await pool.query(
            `UPDATE users
       SET ${fields.join(", ")}, updated_at = NOW()
       WHERE id = $${idPosition} AND role = 'staff'
       RETURNING id, name, email, role, is_active, created_at, updated_at`,
            values,
        );

        if (!result.rowCount) {
            return res.status(404).json({ error: "Staff account not found." });
        }

        return res.json({ staff: result.rows[0] });
    } catch (error) {
        if (error.code === "23505") {
            return res.status(409).json({
                error: "An account with this email already exists.",
            });
        }

        console.error("Staff update failed:", error.message);
        return res.status(500).json({
            error: "Unable to update the staff account.",
        });
    }
});

// Staff account-ஐ deactivate அல்லது மீண்டும் activate செய்தல்.
router.patch("/:id/active", async (req, res) => {
    const id = validStaffId(req.params.id);
    const parsed = activeSchema.safeParse(req.body);

    if (!id) {
        return res.status(400).json({ error: "Invalid staff ID." });
    }

    if (!parsed.success) {
        return res.status(400).json({
            error: "isActive must be true or false.",
        });
    }

    try {
        const result = await pool.query(
            `UPDATE users
       SET is_active = $1, updated_at = NOW()
       WHERE id = $2 AND role = 'staff'
       RETURNING id, name, email, role, is_active, created_at, updated_at`,
            [parsed.data.isActive, id],
        );

        if (!result.rowCount) {
            return res.status(404).json({ error: "Staff account not found." });
        }

        return res.json({ staff: result.rows[0] });
    } catch (error) {
        console.error("Staff account status update failed:", error.message);
        return res.status(500).json({
            error: "Unable to update the staff account status.",
        });
    }
});

export default router;