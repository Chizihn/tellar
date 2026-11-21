import { NextRequest, NextResponse } from "next/server";
import { buildPlan } from "@/lib/plan-agent";
import { DEFAULT_CONTACTS, type Contact } from "@/lib/contacts";

function isContact(value: unknown): value is Contact {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as Contact).id === "string" &&
    typeof (value as Contact).name === "string" &&
    typeof (value as Contact).publicKey === "string"
  );
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const message = body?.message;

  if (typeof message !== "string" || message.trim().length === 0) {
    return NextResponse.json({ error: "message is required" }, { status: 400 });
  }

  const contacts = Array.isArray(body?.contacts) && body.contacts.every(isContact)
    ? (body.contacts as Contact[])
    : DEFAULT_CONTACTS;

  const result = await buildPlan(message, contacts);
  return NextResponse.json(result);
}
