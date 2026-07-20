import type { ModuleManifest, Money } from "@erp/core";

export type Department = {
  id: string;
  code: string;
  name: string;
  manager: string;
  active: boolean;
};

export type WorkShift = {
  id: string;
  code: string;
  name: string;
  startTime: string;
  endTime: string;
  expectedHours: number;
};

export type AttendanceRecord = {
  id: string;
  employeeId: string;
  employeeName: string;
  workDate: string;
  checkIn: string;
  checkOut: string;
  hours: number;
  status: "absent" | "late" | "present";
};

export type ExpenseClaim = {
  id: string;
  employeeId: string;
  employeeName: string;
  number: string;
  status: "approved" | "paid" | "rejected" | "submitted";
  category: string;
  description: string;
  amount: Money;
  submittedAt: string;
  approvedAt: string | null;
  paidAt: string | null;
  journalEntryId: string | null;
};

export type EmployeeAdvance = {
  id: string;
  employeeId: string;
  employeeName: string;
  number: string;
  status: "paid" | "requested";
  amount: Money;
  requestedAt: string;
  paidAt: string | null;
  paymentReference: string | null;
  journalEntryId: string | null;
};

export type SalaryStructure = {
  id: string;
  employeeId: string;
  employeeName: string;
  name: string;
  basePay: Money;
  earnings: Array<{ name: string; amount: Money }>;
  deductions: Array<{ name: string; amount: Money }>;
  active: boolean;
};

export type Payslip = {
  id: string;
  payrollRunId: string;
  employeeId: string;
  employeeName: string;
  grossPay: Money;
  deductions: Money;
  netPay: Money;
  status: "draft" | "posted";
};

export type PayrollRun = {
  id: string;
  number: string;
  periodStart: string;
  periodEnd: string;
  status: "draft" | "posted";
  grossPay: Money;
  deductions: Money;
  netPay: Money;
  postedAt: string | null;
  journalEntryId: string | null;
};

export type HrSnapshot = {
  departments: Department[];
  workShifts: WorkShift[];
  attendance: AttendanceRecord[];
  expenseClaims: ExpenseClaim[];
  employeeAdvances: EmployeeAdvance[];
  salaryStructures: SalaryStructure[];
  payrollRuns: PayrollRun[];
  payslips: Payslip[];
};

export const hrManifest: ModuleManifest = {
  id: "hr",
  name: "HR And Payroll",
  version: "0.1.0",
  description: "Attendance, employee expenses, advances, payroll structures, payroll runs, and payslips.",
  dependencies: ["core", "accounting", "operations"],
  permissions: [
    { key: "hr.read", label: "Read HR and payroll" },
    { key: "hr.manage", label: "Manage HR and payroll" }
  ],
  navigation: [{ label: "HR", path: "/hr", icon: "users", permission: "hr.read", order: 110 }],
  entities: [
    { name: "AttendanceRecord", label: "Attendance Record", permissions: ["hr.read", "hr.manage"] },
    { name: "ExpenseClaim", label: "Expense Claim", permissions: ["hr.read", "hr.manage"] },
    { name: "EmployeeAdvance", label: "Employee Advance", permissions: ["hr.read", "hr.manage"] },
    { name: "PayrollRun", label: "Payroll Run", permissions: ["hr.read", "hr.manage"] },
    { name: "Payslip", label: "Payslip", permissions: ["hr.read", "hr.manage"] }
  ],
  workflows: [
    {
      id: "expense-claim-lifecycle",
      entity: "ExpenseClaim",
      states: ["submitted", "approved", "paid", "rejected"],
      initialState: "submitted",
      terminalStates: ["paid", "rejected"]
    },
    {
      id: "payroll-run-lifecycle",
      entity: "PayrollRun",
      states: ["draft", "posted"],
      initialState: "draft",
      terminalStates: ["posted"]
    }
  ],
  events: ["hr.attendance.recorded", "hr.expense.paid", "hr.payroll.posted"],
  jobs: ["hr.payroll-accrual-review"],
  settings: ["hr_default_work_shift", "hr_payroll_currency"]
};

export const demoHrData: HrSnapshot = {
  departments: [{ id: "dept_sales", code: "SALES", name: "Sales", manager: "Mina Cruz", active: true }],
  workShifts: [{ id: "shift_day", code: "DAY", name: "Day shift", startTime: "09:00", endTime: "17:00", expectedHours: 8 }],
  attendance: [],
  expenseClaims: [],
  employeeAdvances: [],
  salaryStructures: [
    {
      id: "sal_emp_001",
      employeeId: "emp_001",
      employeeName: "Mina Cruz",
      name: "Sales monthly",
      basePay: { amount: 4200, currency: "USD" },
      earnings: [{ name: "Allowance", amount: { amount: 300, currency: "USD" } }],
      deductions: [{ name: "Benefits", amount: { amount: 250, currency: "USD" } }],
      active: true
    }
  ],
  payrollRuns: [],
  payslips: []
};
