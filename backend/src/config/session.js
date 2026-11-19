import "dotenv/config";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import { pool } from "../db/pool.js";

if (!process.env.SESSION_SECRET) {
  throw new Error("SESSION_SECRET is missing from the backend environment.");
}

const PostgreSQLSessionStore = connectPgSimple(session);

export const sessionMiddleware = session({
  name: "inquiry.sid",
  secret: process.env.SESSION_SECRET,
  store: new PostgreSQLSessionStore({
    pool,
    tableName: "user_sessions",
    createTableIfMissing: true,
  }),
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 8 * 60 * 60 * 1000,
  },
});