import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { TransactionRecord } from "@/lib/types";

interface TransactionState {
  transactions: TransactionRecord[];
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  addTransaction: (
    tx: Omit<TransactionRecord, "id" | "createdAt"> & {
      id?: string;
      createdAt?: number;
    }
  ) => TransactionRecord;
  removeTransaction: (hash: string) => void;
  clearHistory: () => void;
}

export const useTransactionStore = create<TransactionState>()(
  persist(
    (set) => ({
      transactions: [],
      isOpen: false,
      setIsOpen: (isOpen) => set({ isOpen }),

      addTransaction: (tx) => {
        const record: TransactionRecord = {
          id: tx.id || tx.hash,
          hash: tx.hash,
          contractId: tx.contractId,
          createdAt: tx.createdAt || Date.now(),
          plan: tx.plan,
          status: tx.status,
          error: tx.error,
        };
        set((state) => ({
          transactions: [
            record,
            ...state.transactions.filter((t) => t.hash !== record.hash),
          ],
        }));
        return record;
      },

      removeTransaction: (hash) => {
        set((state) => ({
          transactions: state.transactions.filter((t) => t.hash !== hash),
        }));
      },

      clearHistory: () => set({ transactions: [] }),
    }),
    {
      name: "tellar-transactions",
      partialize: (state) => ({ transactions: state.transactions }),
    }
  )
);

