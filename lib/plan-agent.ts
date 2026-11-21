import type { Contact } from "./contacts";
import { convertToXlm } from "./fx";
import type { PlanResult } from "./types";

/**
 * Sentence-structure words that can get capitalized (sentence start, "I")
 * without being a recipient name — kept narrow and position-based (see
 * extractRecipientCandidates) rather than a broad stoplist, so a real name
 * like "Uber" used as a noun elsewhere in the sentence doesn't false-positive.
 */
const NON_NAME_WORDS = new Set(["me", "myself", "i"]);

/**
 * Pulls out words in recipient position — after "between"/"among" (split
 * on commas and "and"), or immediately after "to" — so we can tell a real
 * unresolved name ("Tunde" in "pay Tunde") apart from an unrelated
 * capitalized noun elsewhere in the sentence ("Uber" in "...for the Uber").
 */
function extractRecipientCandidates(message: string): string[] {
  const candidates = new Set<string>();

  const betweenMatch = message.match(/\b(?:between|among)\s+(.+?)(?:[.!?]|$)/i);
  if (betweenMatch) {
    for (const part of betweenMatch[1].split(/,|\band\b/i)) {
      const trimmed = part.trim().replace(/^and\s+/i, "");
      if (trimmed && !NON_NAME_WORDS.has(trimmed.toLowerCase())) {
        candidates.add(trimmed);
      }
    }
  }

  const toMatch = message.match(/\bto\s+([A-Za-z][A-Za-z'-]*)\b/);
  if (toMatch && !NON_NAME_WORDS.has(toMatch[1].toLowerCase())) {
    candidates.add(toMatch[1]);
  }

  return [...candidates];
}

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

  // Resilience: a candidate in recipient position that no contact matches
  // means the agent is about to silently drop someone from the split (or,
  // for a single-recipient message, send to no one at all). Name it
  // instead of guessing — checked before the generic fallback below so a
  // specific unresolved name always wins over a vague "who is this for?".
  const unresolved = extractRecipientCandidates(message).filter(
    (candidate) =>
      !contacts.some((c) => c.name.toLowerCase() === candidate.toLowerCase())
  );
  if (unresolved.length > 0) {
    return {
      payments: null,
      needsClarification:
        `I don't have ${unresolved.length > 1 ? "addresses" : "an address"} for ` +
        `${unresolved.join(" or ")} — add them under Contacts first, then try again.`,
    };
  }

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
