import { setDefaultResultOrder } from "node:dns";
import { NextRequest, NextResponse } from "next/server";
import {
  Keypair,
  Transaction,
  TransactionBuilder,
  Operation,
  xdr,
  rpc,
  BASE_FEE,
} from "@stellar/stellar-sdk";
import { NETWORK_PASSPHRASE, RPC_URL } from "@/lib/stellar/config";

/**
 * Implements the wire protocol smart-account-kit's RelayerClient expects
 * (see node_modules/smart-account-kit/dist/relayer.js) — a plain HTTP
 * endpoint, not OpenZeppelin's actual Relayer product. Fee-pays with a
 * server-only secret (RELAYER_SECRET) so the browser never holds a key
 * that can spend anything. Used for both wallet creation ({func, auth})
 * and ordinary payment submission ({xdr}).
 */

// Node's fetch (undici) has been observed flaky over IPv6 against Stellar
// RPC endpoints — see docs/ARCHITECTURE.md's "Lessons carried over from
// eatovr-proof". Cheap, one-time fix; this API route always runs on Node.
setDefaultResultOrder("ipv4first");

const POLL_INTERVAL_MS = 1500;
const POLL_TIMEOUT_MS = 30_000;
const RETRY_ATTEMPTS = 3;
const RETRY_BASE_DELAY_MS = 500;

async function withRetry<T>(fn: () => Promise<T>): Promise<T> {
  let lastErr: unknown;
  for (let attempt = 0; attempt < RETRY_ATTEMPTS; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (attempt < RETRY_ATTEMPTS - 1) {
        await new Promise((resolve) => setTimeout(resolve, RETRY_BASE_DELAY_MS * 2 ** attempt));
      }
    }
  }
  throw lastErr;
}

interface RelayerSuccess {
  success: true;
  hash: string;
}

interface RelayerFailure {
  success: false;
  error: string;
  errorCode?: string;
}

async function submitAndPoll(
  server: rpc.Server,
  tx: Transaction | import("@stellar/stellar-sdk").FeeBumpTransaction
): Promise<RelayerSuccess | RelayerFailure> {
  const sendResult = await withRetry(() => server.sendTransaction(tx));

  if (sendResult.status === "ERROR") {
    return { success: false, error: "Submission rejected by the network.", errorCode: "ONCHAIN_FAILED" };
  }

  const deadline = Date.now() + POLL_TIMEOUT_MS;
  let getResult = await withRetry(() => server.getTransaction(sendResult.hash));
  while (getResult.status === rpc.Api.GetTransactionStatus.NOT_FOUND && Date.now() < deadline) {
    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
    getResult = await withRetry(() => server.getTransaction(sendResult.hash));
  }

  if (getResult.status === rpc.Api.GetTransactionStatus.SUCCESS) {
    return { success: true, hash: sendResult.hash };
  }
  return { success: false, error: "Transaction did not succeed on-chain.", errorCode: "ONCHAIN_FAILED" };
}

export async function POST(req: NextRequest) {
  const relayerSecret = process.env.RELAYER_SECRET;
  if (!relayerSecret) {
    return NextResponse.json(
      { success: false, error: "Relayer not configured." },
      { status: 500 }
    );
  }

  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ success: false, error: "Invalid request body." }, { status: 400 });
  }

  const server = new rpc.Server(RPC_URL);
  const relayerKeypair = Keypair.fromSecret(relayerSecret);

  try {
    if (typeof body.xdr === "string") {
      const innerTx = TransactionBuilder.fromXDR(body.xdr, NETWORK_PASSPHRASE);
      if (!(innerTx instanceof Transaction)) {
        return NextResponse.json(
          { success: false, error: "Expected a single (non-fee-bump) transaction." },
          { status: 400 }
        );
      }
      const feeBump = TransactionBuilder.buildFeeBumpTransaction(
        relayerKeypair,
        BASE_FEE,
        innerTx,
        NETWORK_PASSPHRASE
      );
      feeBump.sign(relayerKeypair);
      const result = await submitAndPoll(server, feeBump);
      return NextResponse.json(result);
    }

    if (typeof body.func === "string" && Array.isArray(body.auth)) {
      const account = await withRetry(() => server.getAccount(relayerKeypair.publicKey()));
      const hostFunction = xdr.HostFunction.fromXDR(body.func, "base64");
      const authEntries = (body.auth as string[]).map((entry) =>
        xdr.SorobanAuthorizationEntry.fromXDR(entry, "base64")
      );

      let tx = new TransactionBuilder(account, {
        fee: BASE_FEE,
        networkPassphrase: NETWORK_PASSPHRASE,
      })
        .addOperation(Operation.invokeHostFunction({ func: hostFunction, auth: authEntries }))
        .setTimeout(60)
        .build();

      const simulation = await withRetry(() => server.simulateTransaction(tx));
      if (rpc.Api.isSimulationError(simulation)) {
        return NextResponse.json(
          { success: false, error: simulation.error, errorCode: "SIMULATION_FAILED" },
          { status: 400 }
        );
      }

      tx = rpc.assembleTransaction(tx, simulation).build();
      tx.sign(relayerKeypair);
      const result = await submitAndPoll(server, tx);
      return NextResponse.json(result);
    }

    return NextResponse.json(
      { success: false, error: "Expected either {xdr} or {func, auth}.", errorCode: "INVALID_PARAMS" },
      { status: 400 }
    );
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
