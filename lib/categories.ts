// Default categories seeded for every new user (see supabase/schema.sql).
// Colors are also used as chart swatches.
export const DEFAULT_EXPENSE_CATEGORIES = [
  { name: "Groceries", color: "#10b981" },
  { name: "Dining", color: "#f59e0b" },
  { name: "Rent", color: "#6366f1" },
  { name: "Utilities", color: "#0ea5e9" },
  { name: "Transport", color: "#8b5cf6" },
  { name: "Entertainment", color: "#ec4899" },
  { name: "Health", color: "#ef4444" },
  { name: "Shopping", color: "#14b8a6" },
  { name: "Travel", color: "#f97316" },
  { name: "Other", color: "#64748b" },
] as const;

export const DEFAULT_INCOME_CATEGORIES = [
  { name: "Salary", color: "#059669" },
  { name: "Freelance", color: "#22c55e" },
  { name: "Investments", color: "#84cc16" },
  { name: "Other income", color: "#a3e635" },
] as const;
