export type TxnKind = "income" | "expense";

export interface Profile {
  id: string;
  full_name: string | null;
  currency: string;
  created_at: string;
}

export interface Category {
  id: string;
  user_id: string;
  name: string;
  kind: TxnKind;
  color: string;
  created_at: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  category_id: string | null;
  kind: TxnKind;
  amount: number;
  occurred_on: string; // YYYY-MM-DD
  note: string | null;
  created_at: string;
  categories?: Pick<Category, "id" | "name" | "color" | "kind"> | null;
}

export interface Budget {
  id: string;
  user_id: string;
  category_id: string;
  month: string; // YYYY-MM-01
  amount: number;
  created_at: string;
}
