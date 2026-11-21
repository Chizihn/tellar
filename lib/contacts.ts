export interface Contact {
  id: string;
  name: string;
  /** "me" has no publicKey — your own share of a split isn't an on-chain transfer, see plan-agent.ts's isSelf handling. */
  publicKey: string;
}

/**
 * Seeded for a first run so the demo works before anyone adds a real
 * contact. These two are real, funded testnet accounts (generated via
 * `stellar keys generate` + `stellar keys fund`), not placeholders — see
 * contracts/disperse's deploy trail for how they were verified.
 */
export const DEFAULT_CONTACTS: Contact[] = [
  { id: "me", name: "You", publicKey: "" },
  { id: "chidi", name: "Chidi", publicKey: "GAOKKQZBUNWAJ4ASBX4GMYFDT4QHQYC5XJAZ4FGLJSNSBNQ4I3FYOGCS" },
  { id: "ada", name: "Ada", publicKey: "GARYBUYD3X55KTLOOMRYHGTAXQC4NAJSA576ZK5JJUXFHCBJDT5KUUFN" },
];

export function findContact(contacts: Contact[], name: string): Contact | undefined {
  const needle = name.trim().toLowerCase();
  return contacts.find((c) => c.name.toLowerCase() === needle);
}
