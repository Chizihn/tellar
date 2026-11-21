import { create } from "zustand";
import type { ChatMessage } from "@/lib/types";
import { useContactsStore } from "@/lib/stores/use-contacts-store";

interface ChatState {
  messages: ChatMessage[];
  isSending: boolean;
  sendMessage: (text: string) => Promise<void>;
}

function makeId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  isSending: false,

  sendMessage: async (text: string) => {
    const userMessage: ChatMessage = {
      id: makeId(),
      role: "user",
      text,
      createdAt: Date.now(),
    };
    set({ messages: [...get().messages, userMessage], isSending: true });

    try {
      const contacts = useContactsStore.getState().contacts;
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, contacts }),
      });
      const data = await res.json();

      const assistantMessage: ChatMessage = {
        id: makeId(),
        role: "assistant",
        text: data.needsClarification ?? "Here's the plan — check it over before I sign anything.",
        plan: data.needsClarification ? undefined : data,
        createdAt: Date.now(),
      };
      set({ messages: [...get().messages, assistantMessage] });
    } catch {
      const errorMessage: ChatMessage = {
        id: makeId(),
        role: "assistant",
        text: "Something went wrong reaching the plan agent. Try again?",
        createdAt: Date.now(),
      };
      set({ messages: [...get().messages, errorMessage] });
    } finally {
      set({ isSending: false });
    }
  },
}));
