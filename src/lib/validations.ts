import { z } from "zod/v4";

// ============================================
// AUTH
// ============================================

export const loginSchema = z.object({
  email: z.string().min(1, "Tài khoản không được để trống"),
  password: z.string().min(1, "Mật khẩu không được để trống"),
});

export const registerSchema = z.object({
  name: z.string().min(2, "Tên tối thiểu 2 ký tự"),
  email: z.email("Email không hợp lệ"),
  password: z.string().min(6, "Mật khẩu tối thiểu 6 ký tự"),
});

// ============================================
// TEAM
// ============================================

export const createTeamSchema = z.object({
  name: z.string().min(2, "Tên đội tối thiểu 2 ký tự"),
  logo: z.string().url().optional().or(z.literal("")),
});

export const addMemberSchema = z.object({
  teamId: z.string().min(1),
  userId: z.string().min(1),
  nickname: z.string().min(1, "Nickname là bắt buộc"),
  gameUid: z.string().optional(),
});

// ============================================
// TASK
// ============================================

export const createTaskSchema = z.object({
  name: z.string().min(2, "Tên nhiệm vụ tối thiểu 2 ký tự"),
  description: z.string().optional(),
  date: z.string().min(1, "Ngày là bắt buộc"),
  time: z.string().optional(),
  map: z.string().optional(),
  roomId: z.string().optional(),
  roomPassword: z.string().optional(),
  requirements: z.string().optional(),
  entryFee: z.number().min(0).optional().default(0),
  teamIds: z.array(z.string()).min(1, "Chọn ít nhất 1 đội"),
});

// ============================================
// MATCH RESULT / REPORT
// ============================================

export const submitReportSchema = z.object({
  taskTeamId: z.string().min(1),
  rank: z.number().int().min(1, "Hạng phải >= 1"),
  totalKills: z.number().int().min(0, "Kills phải >= 0"),
  resultType: z.enum(["WIN", "TOP_2", "TOP_3", "TOP_5", "TOP_10", "OTHER"]),
  prizeMoney: z.number().min(0).optional().default(0),
  screenshot: z.string().optional(),
  note: z.string().optional(),
  playerResults: z
    .array(
      z.object({
        teamMemberId: z.string().min(1),
        kills: z.number().int().min(0),
      })
    )
    .optional(),
});

// ============================================
// FINANCE
// ============================================

export const createSalarySchema = z.object({
  teamId: z.string().min(1),
  month: z.string().regex(/^\d{4}-\d{2}$/, "Format: YYYY-MM"),
  amount: z.number().positive("Số tiền phải > 0"),
  note: z.string().optional(),
});

export const createBonusSchema = z.object({
  name: z.string().min(2, "Tên thưởng tối thiểu 2 ký tự"),
  reason: z.string().optional(),
  amount: z.number().positive("Số tiền phải > 0"),
  month: z.string().regex(/^\d{4}-\d{2}$/, "Format: YYYY-MM"),
  teamId: z.string().min(1),
  teamMemberId: z.string().optional(),
});

export const createRevenueSchema = z.object({
  teamId: z.string().min(1),
  amount: z.number().positive("Số tiền phải > 0"),
  source: z.string().min(1, "Nguồn doanh thu là bắt buộc"),
  date: z.string().min(1, "Ngày là bắt buộc"),
  note: z.string().optional(),
});

export const createExpenseSchema = z.object({
  teamId: z.string().optional(),
  amount: z.number().positive("Số tiền phải > 0"),
  category: z.string().min(1, "Danh mục là bắt buộc"),
  date: z.string().min(1, "Ngày là bắt buộc"),
  note: z.string().optional(),
});

// ============================================
// VIOLATION
// ============================================

export const createViolationSchema = z.object({
  teamId: z.string().min(1),
  teamMemberId: z.string().optional(),
  description: z.string().min(5, "Mô tả tối thiểu 5 ký tự"),
  severity: z.enum(["WARNING", "MINOR", "MAJOR", "CRITICAL"]),
  proof: z.string().optional(),
});

// ============================================
// SALARY POLICY
// ============================================

export const salaryPolicySchema = z.object({
  name: z.string().min(2),
  baseSalary: z.number().positive(),
  currency: z.string().default("VND"),
  requirements: z.string().optional(),
  minTasks: z.number().int().min(0).default(0),
  minWinrate: z.number().min(0).max(100).default(0),
});

// Types
export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type CreateTeamInput = z.infer<typeof createTeamSchema>;
export type AddMemberInput = z.infer<typeof addMemberSchema>;
export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type SubmitReportInput = z.infer<typeof submitReportSchema>;
export type CreateSalaryInput = z.infer<typeof createSalarySchema>;
export type CreateBonusInput = z.infer<typeof createBonusSchema>;
export type CreateRevenueInput = z.infer<typeof createRevenueSchema>;
export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;
export type CreateViolationInput = z.infer<typeof createViolationSchema>;
export type SalaryPolicyInput = z.infer<typeof salaryPolicySchema>;
