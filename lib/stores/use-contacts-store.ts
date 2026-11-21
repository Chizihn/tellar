import "@/lib/stellar/buffer-polyfill";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { validateAddress } from "smart-account-kit";
import { DEFAULT_CONTACTS, type Contact } from "@/lib/contacts";

function slugify(name: string) {
  return name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

interface ContactsState {
  contacts: Contact[];
  /** Throws with a human-readable message on invalid input — callers show it directly. */
  addContact: (name: string, publicKey: string) => void;
  removeContact: (id: string) => void;
}

export const useContactsStore = create<ContactsState>()(
  persist(
    (set, get) => ({
      contacts: DEFAULT_CONTACTS,

      addContact: (name, publicKey) => {
        const trimmedName = name.trim();
        if (!trimmedName) throw new Error("Give this contact a name.");

        const address = publicKey.trim();
        try {
          validateAddress(address, "address");
        } catch {
          throw new Error("That doesn't look like a valid Stellar address (G… or C…).");
        }

        const id = slugify(trimmedName);
        if (!id) throw new Error("Give this contact a name.");
        if (get().contacts.some((c) => c.id === id)) {
          throw new Error(`"${trimmedName}" is already a contact.`);
        }

        set((state) => ({
          contacts: [...state.contacts, { id, name: trimmedName, publicKey: address }],
        }));
      },

      removeContact: (id) => {
        if (id === "me") return;
        set((state) => ({ contacts: state.contacts.filter((c) => c.id !== id) }));
      },
    }),
    { name: "tellar-contacts" }
  )
);
