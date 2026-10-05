export type FundingStatus = "RECEIVED" | "PENDING" | "CANCELLED";

export type BudgetStatus = "PLANNED" | "VALIDATED" | "PAID" | "CANCELLED";

export type BudgetCategory = "SUPPLIES" | "SERVICES" | "SOFTWARE" | "OTHER";

export interface FundingSource {
  id: string;
  projectId: string;
  name: string;
  amount: number;
  date: string | Date;
  comment: string | null;
  status: FundingStatus;
  createdAt?: string | Date;
  createdBy?: { name: string; email: string } | null;
}

export interface BudgetEntry {
  id: string;
  projectId: string;
  fundingSourceId: string | null;
  fundingSource?: { id: string; name: string } | null;
  label: string;
  quantity: number | null;
  unitPrice: number | null;
  deliveryCost: number | null;
  amount: number;
  date: string | Date;
  category: BudgetCategory;
  comment: string | null;
  status: BudgetStatus;
  createdBy?: { name: string; email: string } | null;
}

export interface SourceBalance {
  source: FundingSource;
  allocated: number;
  spent: number;
  remaining: number;
}
