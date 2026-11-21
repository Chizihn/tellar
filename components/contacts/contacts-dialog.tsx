"use client";

import { useState } from "react";
import { toast } from "sonner";
import { QrCode, Trash2, Users } from "lucide-react";
import { truncateAddress } from "smart-account-kit";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useContactsStore } from "@/lib/stores/use-contacts-store";
import { QrScanner } from "@/components/contacts/qr-scanner";

export function ContactsDialog() {
  const { contacts, addContact, removeContact } = useContactsStore();
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [scanning, setScanning] = useState(false);

  function handleAdd() {
    try {
      addContact(name, address);
      setName("");
      setAddress("");
      toast.success(`Added ${name.trim()} as a contact.`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't add that contact.");
    }
  }

  return (
    <Dialog>
      <DialogTrigger
        render={
          <Button variant="outline" size="sm" className="gap-1.5" aria-label="Contacts">
            <Users className="size-3.5 text-muted-foreground" />
            <span className="hidden sm:inline">Contacts</span>
          </Button>
        }
      />
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Contacts</DialogTitle>
          <DialogDescription>
            Who Tellar can resolve a name to when you ask for a payment. Add
            anyone with a real Stellar address — testnet only.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          {contacts.map((contact) => (
            <div
              key={contact.id}
              className="flex items-center justify-between gap-2 rounded-lg border px-3 py-2"
            >
              <div>
                <div className="text-sm font-medium">{contact.name}</div>
                <div className="font-mono text-xs text-muted-foreground">
                  {contact.publicKey ? truncateAddress(contact.publicKey) : "—"}
                </div>
              </div>
              {contact.id !== "me" && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7"
                  onClick={() => removeContact(contact.id)}
                  aria-label={`Remove ${contact.name}`}
                >
                  <Trash2 className="size-3.5" />
                </Button>
              )}
            </div>
          ))}
        </div>

        <Separator />

        {scanning ? (
          <QrScanner
            onScan={(scannedAddress) => {
              setAddress(scannedAddress);
              setScanning(false);
              toast.success("Address scanned — give them a name and add.");
            }}
            onCancel={() => setScanning(false)}
          />
        ) : (
          <div className="space-y-2">
            <div className="space-y-1">
              <Label htmlFor="contact-name">Name</Label>
              <Input
                id="contact-name"
                placeholder="Chidi"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="contact-address">Stellar address</Label>
              <div className="flex gap-1.5">
                <Input
                  id="contact-address"
                  placeholder="G… or C…"
                  className="font-mono"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="shrink-0"
                  onClick={() => setScanning(true)}
                  aria-label="Scan a QR code"
                >
                  <QrCode className="size-4" />
                </Button>
              </div>
            </div>
            <Button className="w-full" onClick={handleAdd} disabled={!name.trim() || !address.trim()}>
              Add contact
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
