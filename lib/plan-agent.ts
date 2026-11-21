import type { Contact } from "./contacts";
import { convertToXlm } from "./fx";
import type { PlanResult } from "./types";

/**
 * Rule-based stand-in for the real plan agent described in
 * docs/ARCHITECTURE.md §2. Swap the body of this function for an LLM call
 * once a provider/API key is chosen — callers (app/api/chat/route.ts) only
 * depend on the PlanResult contract, not on how it's produced.
 *
 * `contacts` comes from the caller, not a server-side constant: contacts
 * are the user's own data, stored in their browser (see
 * lib/stores/use-contacts-store.ts), so each request carries the current
 * list for this server-side function to resolve names against.
 */
export async function buildPlan(message: string, contacts: Contact[]): Promise<PlanResult> {
  const amountMatch = message.match(/(?:₦|ngn)\s?([\d,]+(?:\.\d+)?)/i);
  const currency = "NGN";

  if (!amountMatch) {
    return {
      payments: null,
      needsClarification:
        "How much is this for? Give me an amount, e.g. \"split ₦12,000 lunch between me, Chidi, and Ada\".",
    };
  }

  const totalLocal = Number(amountMatch[1].replace(/,/g, ""));

  const mentionsSelf = /\b(me|myself|i)\b/i.test(message);
  const mentionedContacts = contacts.filter((c) => {
    if (c.id === "me") return mentionsSelf;
    return new RegExp(`\\b${c.name}\\b`, "i").test(message);
  });

  if (mentionedContacts.length === 0) {
    return {
      payments: null,
      needsClarification:
        "Who should this be split between? I can resolve: " +
        contacts.map((c) => c.name).join(", "),
    };
  }

  const splitLocal = totalLocal / mentionedContacts.length;
  const { amountXlm: splitXlm, xlmRate } = await convertToXlm(
    splitLocal,
    currency
  );

  const payments = mentionedContacts.map((contact) => ({
    recipient: contact.id,
    recipientName: contact.name,
    recipientAddress: contact.publicKey,
    amountLocal: splitLocal,
    currency,
    amountXlm: splitXlm,
    isSelf: contact.id === "me",
  }));

  return {
    payments,
    currency,
    totalLocal,
    totalXlm: splitXlm * payments.length,
    onChainTotalXlm: splitXlm * payments.filter((p) => !p.isSelf).length,
    xlmRate,
    needsClarification: null,
  };
}
