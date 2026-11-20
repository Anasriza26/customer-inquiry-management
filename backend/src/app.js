import express from "express";
import cors from "cors";
import helmet from "helmet";
import { pool } from "./db/pool.js";
import { sessionMiddleware } from "./config/session.js";
import authRoutes from "./modules/auth/auth.routes.js";
import inquiryRoutes from "./modules/inquiries/inquiries.routes.js";
import staffRoutes from "./modules/staff/staff.routes.js";

const app = express();

app.use(helmet());
app.use(
    cors({
        origin: process.env.FRONTEND_ORIGIN || "http://localhost:3000",
        credentials: true,
    }),
);
app.use(express.json({ limit: "1mb" }));
app.use(sessionMiddleware);
app.use("/api/inquiries", inquiryRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/admin/staff", staffRoutes);

app.get("/api/health", async (req, res) => {
    try {
        const result = await pool.query("SELECT NOW() AS database_time");

        res.json({
            status: "ok",
            message: "API and database are connected.",
            databaseTime: result.rows[0].database_time,
        });
    } catch (error) {
        console.error("Database health check failed:", error.message);

        res.status(503).json({
            status: "error",
            message: "Database connection is unavailable.",
        });
    }
});

export default app;