export interface PlannedPayment {
  recipient: string;
  recipientName: string;
  /** Stellar address to send to — empty for isSelf payments. */
  recipientAddress: string;
  amountLocal: number;
  currency: string;
  amountXlm: number;
  /** Your own share — shown for context, never sent as an on-chain transfer. */
  isSelf: boolean;
}

export interface Plan {
  payments: PlannedPayment[];
  currency: string;
  totalLocal: number;
  totalXlm: number;
  /** Sum actually moved on-chain — excludes any isSelf payment. */
  onChainTotalXlm: number;
  xlmRate: number;
  needsClarification: null;
}

export interface ClarificationNeeded {
  payments: null;
  needsClarification: string;
}

export type PlanResult = Plan | ClarificationNeeded;

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  plan?: Plan;
  createdAt: number;
}

export interface TransactionRecord {
  id: string;
  hash: string;
  contractId: string;
  createdAt: number;
  plan: Plan;
  status: "success" | "failed";
  error?: string;
}

