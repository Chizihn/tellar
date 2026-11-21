# Tellar

*Say it. Tellar sends it.*

A mini hackathon entry for **Stellar: Build and Beyond** (**AI & Stellar**
track) — built for fun, on a tight clock, as a side project alongside the
main `eatovr-proof` submission (a separate hackathon entry entirely,
living in its own repo/session on purpose — this project doesn't touch
that codebase or that session).

Tellar is a conversational agent that turns natural-language payment
requests ("split today's ₦12,000 lunch between me, Chidi, and Ada") into
a single Stellar transaction — reasoned out, shown to you as an itemized
plan, and signed with one passkey tap. No seed phrase, no manual
transaction building, no typing wallet addresses.

## Status

Not built yet. See `docs/PITCH.md` for what this is and why, and
`docs/ARCHITECTURE.md` for how it's going to be built. `CLAUDE.md` has
the working instructions for whatever session picks this up next.

## Why a webapp, not a mobile app

Passkeys/WebAuthn are a native browser API (`navigator.credentials`) —
no native module, no Expo dev client, no EAS build, no Xcode version
chasing. All of that pain showed up building eatovr's *mobile* passkey
integration. A plain Next.js webapp sidesteps every bit of it and is
the only realistic scope given the time available.
# tellar
