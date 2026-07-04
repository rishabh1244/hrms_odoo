import bcrypt from "bcryptjs";
import "dotenv/config";
import { Pool } from "pg";
//1 HR: sarah.hr@acme.com / Hr@12345
const pool = new Pool({ connectionString: process.env.PSQL_URL });

const DEPARTMENTS = [
  "Engineering",
  "Marketing",
  "Sales",
  "HR",
  "Finance",
  "Operations",
  "Design",
  "Support",
];
const DESIGNATIONS: Record<string, string[]> = {
  Engineering: [
    "Junior Developer",
    "Senior Developer",
    "Tech Lead",
    "Engineering Manager",
  ],
  Marketing: ["Marketing Associate", "Marketing Manager", "Brand Strategist"],
  Sales: ["Sales Rep", "Sales Manager", "Account Executive"],
  HR: ["HR Associate", "HR Manager", "Recruiter"],
  Finance: ["Accountant", "Finance Manager", "CFO"],
  Operations: ["Operations Associate", "Operations Manager"],
  Design: ["Junior Designer", "Senior Designer", "Design Lead"],
  Support: ["Support Agent", "Support Lead", "Customer Success Manager"],
};

const FIRST_NAMES = [
  "Alice",
  "Bob",
  "Charlie",
  "Diana",
  "Eve",
  "Frank",
  "Grace",
  "Hank",
  "Ivy",
  "Jack",
  "Kate",
  "Leo",
  "Mia",
  "Noah",
  "Olivia",
  "Paul",
  "Quinn",
  "Rose",
  "Sam",
  "Tina",
  "Uma",
  "Victor",
  "Wendy",
  "Xander",
  "Yara",
  "Zane",
  "Aria",
  "Blake",
  "Cora",
  "Dylan",
];

const LAST_NAMES = [
  "Smith",
  "Johnson",
  "Williams",
  "Brown",
  "Jones",
  "Garcia",
  "Miller",
  "Davis",
  "Rodriguez",
  "Martinez",
  "Hernandez",
  "Lopez",
  "Gonzalez",
  "Wilson",
  "Anderson",
  "Thomas",
  "Taylor",
  "Moore",
  "Jackson",
  "Martin",
  "Lee",
  "Perez",
  "Thompson",
  "White",
  "Harris",
  "Clark",
];

function rand(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomDate(startYear: number, endYear: number) {
  const start = new Date(startYear, 0, 1).getTime();
  const end = new Date(endYear, 11, 31).getTime();
  return new Date(start + Math.random() * (end - start));
}

function pick<T>(arr: T[]) {
  return arr[rand(0, arr.length - 1)];
}

async function seed() {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Clean existing
    await client.query("DELETE FROM attendance_records");
    await client.query("DELETE FROM payroll");
    await client.query("DELETE FROM employee_details");
    await client.query("DELETE FROM users");

    // Create HR
    const hrPass = await bcrypt.hash("Hr@12345", 12);
    const hr = await client.query(
      `INSERT INTO users (company_name, name, email, phone, employee_id, role, password_hash, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       RETURNING id`,
      [
        "Acme Corp",
        "Sarah HR",
        "sarah.hr@acme.com",
        "9876543210",
        "ACSAHR20260001",
        "hr",
        hrPass,
        "present",
      ],
    );
    const hrId = hr.rows[0].id;

    await client.query(
      `INSERT INTO employee_details (user_id, date_of_birth, age, joining_date, department, designation, address)
       VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [
        hrId,
        "1990-03-15",
        36,
        "2020-01-15",
        "HR",
        "HR Manager",
        "123 Admin St, New York, NY",
      ],
    );

    await client.query(
      `INSERT INTO payroll (user_id, monthly_wage, yearly_wage, travel_allowance, fixed_allowance, tax_deduction, effective_date)
       VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [hrId, 120000, 1440000, 15000, 25000, 30000, "2026-01-01"],
    );

    // Seed attendance for HR
    for (let d = 1; d <= 30; d++) {
      const date = `2026-06-${String(d).padStart(2, "0")}`;
      const status =
        d % 7 === 0 ? "absent" : d % 5 === 0 ? "halfday" : "present";
      const checkIn =
        status === "absent"
          ? null
          : `09:${rand(0, 30).toString().padStart(2, "0")}`;
      const checkOut =
        status === "absent"
          ? null
          : status === "halfday"
            ? `13:${rand(0, 30).toString().padStart(2, "0")}`
            : `18:${rand(0, 30).toString().padStart(2, "0")}`;
      await client.query(
        `INSERT INTO attendance_records (user_id, date, check_in, check_out, status) VALUES ($1,$2,$3,$4,$5)`,
        [hrId, date, checkIn, checkOut, status],
      );
    }

    const empPass = await bcrypt.hash("Emp@12345", 12);
    const employeeIds: number[] = [];

    // Create 25 employees
    for (let i = 0; i < 25; i++) {
      const firstName = pick(FIRST_NAMES);
      const lastName = pick(LAST_NAMES);
      const name = `${firstName} ${lastName}`;
      const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@acme.com`;
      const phone = `${rand(6000000000, 9999999999)}`;
      const seq = String(60002 + i).padStart(5, "0");
      const initials = name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase();
      const employeeId = `AC${initials}2026${seq}`;
      const department = pick(DEPARTMENTS);
      const designation = pick(DESIGNATIONS[department]);
      const dob = randomDate(1975, 2000);
      const age = new Date().getFullYear() - dob.getFullYear();
      const joiningDate = randomDate(2018, 2026);
      const monthlyWage = rand(25000, 150000);
      const yearlyWage = monthlyWage * 12;
      const travelAllowance = rand(2000, 15000);
      const fixedAllowance = rand(5000, 30000);
      const taxDeduction = Math.round((monthlyWage * rand(5, 15)) / 100);
      const statuses = [
        "present",
        "present",
        "present",
        "absent",
        "leave",
        "halfday",
        "present",
      ];
      const currentStatus = pick(statuses);

      const emp = await client.query(
        `INSERT INTO users (company_name, name, email, phone, employee_id, role, password_hash, status)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id`,
        [
          "Acme Corp",
          name,
          email,
          phone,
          employeeId,
          "employee",
          empPass,
          currentStatus,
        ],
      );
      const empId = emp.rows[0].id;
      employeeIds.push(empId);

      await client.query(
        `INSERT INTO employee_details (user_id, date_of_birth, age, joining_date, department, designation, address)
         VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [
          empId,
          dob.toISOString().split("T")[0],
          age,
          joiningDate.toISOString().split("T")[0],
          department,
          designation,
          `${rand(100, 999)} ${pick(["Oak", "Maple", "Pine", "Elm", "Cedar"])} St, ${pick(["New York", "San Francisco", "Chicago", "Austin", "Boston"])}, ${pick(["NY", "CA", "IL", "TX", "MA"])}`,
        ],
      );

      await client.query(
        `INSERT INTO payroll (user_id, monthly_wage, yearly_wage, travel_allowance, fixed_allowance, tax_deduction, effective_date)
         VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [
          empId,
          monthlyWage,
          yearlyWage,
          travelAllowance,
          fixedAllowance,
          taxDeduction,
          "2026-01-01",
        ],
      );

      // Attendance for last 30 days
      for (let d = 1; d <= 30; d++) {
        const date = `2026-06-${String(d).padStart(2, "0")}`;
        const st = d % 7 === 0 ? "absent" : d % 5 === 0 ? "halfday" : "present";
        const ci =
          st === "absent"
            ? null
            : `${rand(8, 10).toString().padStart(2, "0")}:${rand(0, 59).toString().padStart(2, "0")}`;
        const co =
          st === "absent"
            ? null
            : st === "halfday"
              ? `13:${rand(0, 30).toString().padStart(2, "0")}`
              : `${rand(17, 19).toString().padStart(2, "0")}:${rand(0, 59).toString().padStart(2, "0")}`;
        await client.query(
          `INSERT INTO attendance_records (user_id, date, check_in, check_out, status) VALUES ($1,$2,$3,$4,$5)`,
          [empId, date, ci, co, st],
        );
      }
    }

    await client.query("COMMIT");

    console.log(`Seeded: 1 HR + ${employeeIds.length} employees`);
    console.log("HR email: sarah.hr@acme.com / password: Hr@12345");
    console.log(
      "Employee email pattern: <first>.<last><n>@acme.com / password: Emp@12345",
    );
    console.log(`Sample employee: alice.smith0@acme.com / Emp@12345`);
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Seed failed:", err);
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
