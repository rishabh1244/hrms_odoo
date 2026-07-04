import { Router, type Request, type Response } from "express";
import { type JwtPayload } from "jsonwebtoken";
import { authenticateJwt } from "./auth";
import { pool } from "../utils/db";
import { requireHrOrAdmin } from "../utils/requireHrOrAdmin";

const router = Router();

type AuthRequest = Request & { user?: JwtPayload | string };

async function getFullProfile(userId: number) {
  const user = await pool.query(
    `SELECT id, company_name, name, email, phone, employee_id, role, status, created_at
     FROM users WHERE id = $1`,
    [userId],
  );
  if (!user.rows[0]) return null;

  const details = await pool.query(
    "SELECT * FROM employee_details WHERE user_id = $1",
    [userId],
  );

  const payroll = await pool.query(
    "SELECT * FROM payroll WHERE user_id = $1 ORDER BY effective_date DESC LIMIT 1",
    [userId],
  );

  const attendance = await pool.query(
    "SELECT * FROM attendance_records WHERE user_id = $1 ORDER BY date DESC LIMIT 30",
    [userId],
  );

  return {
    ...user.rows[0],
    details: details.rows[0] ?? null,
    payroll: payroll.rows[0] ?? null,
    attendance: attendance.rows,
  };
}

router.get("/", authenticateJwt, async (req: AuthRequest, res: Response) => {
  try {
    if (typeof req.user === "string" || !req.user?.userId) {
      return res.status(401).json({ message: "Invalid token" });
    }

    const profile = await getFullProfile(Number(req.user.userId));
    if (!profile) {
      return res.status(404).json({ message: "Profile not found" });
    }

    res.json({ profile });
  } catch (error) {
    console.error("Error fetching profile:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.get(
  "/:employee_id",
  authenticateJwt,
  requireHrOrAdmin,
  async (req: AuthRequest, res: Response) => {
    try {
      const employeeId = req.params.employee_id;

      const user = await pool.query(
        "SELECT id FROM users WHERE employee_id = $1",
        [employeeId],
      );

      if (!user.rows[0]) {
        return res.status(404).json({ message: "Employee not found" });
      }

      const profile = await getFullProfile(user.rows[0].id);
      res.json({ profile });
    } catch (error) {
      console.error("Error fetching employee profile:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  },
);

export default router;
