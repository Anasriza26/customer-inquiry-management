import { Router } from "express";
import { z } from "zod";
import { pool } from "../../db/pool.js";
import { requireAuth } from "../../middleware/require-auth.js";

const router = Router();

const statuses = ["New", "In Progress", "Resolved"];

const createInquirySchema = z.object({
    customerName: z.string().trim().min(1).max(120),
    customerContact: z.string().trim().min(3).max(255),
    subject: z.string().trim().min(1).max(200),
    description: z.string().trim().min(1).max(5000),
});

const statusSchema = z.object({
    status: z.enum(statuses),
    expectedStatus: z.enum(statuses),
});

function validId(value) {
    const id = Number(value);
    return Number.isInteger(id) && id > 0 ? id : null;
}

router.use(requireAuth);

router.get("/", async (req, res) => {
    const querySchema = z.object({
        q: z.string().trim().max(100).optional(),
        status: z.enum(statuses).optional(),
    });

    const parsed = querySchema.safeParse(req.query);

    if (!parsed.success) {
        return res.status(400).json({ error: "Invalid search or status filter." });
    }

    const conditions = [];
    const values = [];

    if (req.session.user.role !== "admin") {
        values.push(req.session.user.id);
        conditions.push(`created_by = $${values.length}`);
    }

    if (parsed.data.status) {
        values.push(parsed.data.status);
        conditions.push(`status = $${values.length}`);
    }

    if (parsed.data.q) {
        values.push(`%${parsed.data.q}%`);
        conditions.push(
            `(customer_name ILIKE $${values.length}
        OR subject ILIKE $${values.length}
        OR customer_contact ILIKE $${values.length})`,
        );
    }

    const whereClause = conditions.length
        ? `WHERE ${conditions.join(" AND ")}`
        : "";

    try {
        const result = await pool.query(
            `SELECT id, customer_name, customer_contact, subject,
              description, status, created_by, created_at, updated_at
       FROM inquiries
       ${whereClause}
       ORDER BY updated_at DESC
       LIMIT 100`,
            values,
        );

        return res.json({ inquiries: result.rows });
    } catch (error) {
        console.error("Inquiry list failed:", error.message);
        return res.status(500).json({ error: "Unable to load inquiries." });
    }
});

router.post("/", async (req, res) => {
    const parsed = createInquirySchema.safeParse(req.body);

    if (!parsed.success) {
        return res.status(400).json({
            error: "Check the required inquiry fields.",
            details: parsed.error.flatten().fieldErrors,
        });
    }

    const { customerName, customerContact, subject, description } = parsed.data;

    try {
        const result = await pool.query(
            `INSERT INTO inquiries
         (customer_name, customer_contact, subject, description, created_by)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, customer_name, customer_contact, subject,
                 description, status, created_by, created_at, updated_at`,
            [
                customerName,
                customerContact,
                subject,
                description,
                req.session.user.id,
            ],
        );

        return res.status(201).json({ inquiry: result.rows[0] });
    } catch (error) {
        console.error("Inquiry creation failed:", error.message);
        return res.status(500).json({ error: "Unable to create inquiry." });
    }
});

router.get("/:id", async (req, res) => {
    const id = validId(req.params.id);

    if (!id) {
        return res.status(400).json({ error: "Invalid inquiry ID." });
    }

    const values = [id];
    let ownershipClause = "";

    if (req.session.user.role !== "admin") {
        values.push(req.session.user.id);
        ownershipClause = `AND created_by = $${values.length}`;
    }

    try {
        const result = await pool.query(
            `SELECT id, customer_name, customer_contact, subject,
              description, status, created_by, created_at, updated_at
       FROM inquiries
       WHERE id = $1 ${ownershipClause}`,
            values,
        );

        if (!result.rowCount) {
            return res.status(404).json({ error: "Inquiry not found." });
        }

        return res.json({ inquiry: result.rows[0] });
    } catch (error) {
        console.error("Inquiry lookup failed:", error.message);
        return res.status(500).json({ error: "Unable to load inquiry." });
    }
});

router.patch("/:id/status", async (req, res) => {
    const id = validId(req.params.id);
    const parsed = statusSchema.safeParse(req.body);

    if (!id) {
        return res.status(400).json({ error: "Invalid inquiry ID." });
    }

    if (!parsed.success) {
        return res.status(400).json({
            error: "Provide a valid status and expectedStatus.",
        });
    }

    const { status: newStatus, expectedStatus } = parsed.data;

    const allowedNextStatuses = {
        New: ["In Progress"],
        "In Progress": ["Resolved"],
        Resolved: ["In Progress"],
    };

    if (!allowedNextStatuses[expectedStatus].includes(newStatus)) {
        return res.status(409).json({
            error: `Cannot change status from ${expectedStatus} to ${newStatus}.`,
        });
    }

    const values = [newStatus, id, expectedStatus];
    let ownershipClause = "";

    if (req.session.user.role !== "admin") {
        values.push(req.session.user.id);
        ownershipClause = `AND created_by = $${values.length}`;
    }

    try {
        const updated = await pool.query(
            `UPDATE inquiries
       SET status = $1, updated_at = NOW()
       WHERE id = $2
         AND status = $3
         ${ownershipClause}
       RETURNING id, customer_name, customer_contact, subject,
                 description, status, created_by, created_at, updated_at`,
            values,
        );

        if (updated.rowCount) {
            return res.json({ inquiry: updated.rows[0] });
        }

        // Update நடக்கவில்லை: அந்த inquiry-ஐ user அணுக முடியுமா என்று பார்க்கிறோம்.
        const lookupValues = [id];
        let accessClause = "";

        if (req.session.user.role !== "admin") {
            lookupValues.push(req.session.user.id);
            accessClause = `AND created_by = $${lookupValues.length}`;
        }

        const current = await pool.query(
            `SELECT id, status, updated_at
       FROM inquiries
       WHERE id = $1 ${accessClause}`,
            lookupValues,
        );

        if (!current.rowCount) {
            return res.status(404).json({ error: "Inquiry not found." });
        }

        return res.status(409).json({
            error: "This inquiry has changed since you loaded it. Refresh and try again.",
            currentStatus: current.rows[0].status,
            updatedAt: current.rows[0].updated_at,
        });
    } catch (error) {
        console.error("Inquiry status update failed:", error.message);

        return res.status(500).json({
            error: "Unable to update inquiry status.",
        });
    }
});

export default router;