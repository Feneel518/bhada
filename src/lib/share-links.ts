import "server-only";

// Public, unguessable links for a single bill or receipt. The token carries the
// record id and an HMAC, so no extra table is needed and a link can't be
// altered to point at somebody else's record. Rotating SHARE_LINK_SECRET (or
// BETTER_AUTH_SECRET when it is unset) invalidates every link at once.

import { shareKey, type ShareKind, type ShareLinks } from "@/lib/share-keys";

export type { ShareKind, ShareLinks };

const kindCodes: Record<ShareKind, string> = { rent: "r", electricity: "e", receipt: "p" };
const codeKinds = Object.fromEntries(
  Object.entries(kindCodes).map(([kind, code]) => [code, kind]),
) as Record<string, ShareKind>;

function secret() {
  const value = process.env.SHARE_LINK_SECRET?.trim() || process.env.BETTER_AUTH_SECRET?.trim();
  if (!value) throw new Error("SHARE_LINK_SECRET or BETTER_AUTH_SECRET must be set.");
  return value;
}

function base64url(bytes: Uint8Array) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

let cachedKey: { secret: string; key: Promise<CryptoKey> } | null = null;

function signingKey() {
  const value = secret();
  if (cachedKey?.secret !== value) {
    cachedKey = {
      secret: value,
      key: crypto.subtle.importKey(
        "raw",
        new TextEncoder().encode(`bhadaa-share:${value}`),
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign"],
      ),
    };
  }
  return cachedKey.key;
}

async function signature(payload: string) {
  const encoder = new TextEncoder();
  const key = await signingKey();
  const signed = new Uint8Array(await crypto.subtle.sign("HMAC", key, encoder.encode(payload)));
  // 128 bits is plenty for an unguessable link and keeps WhatsApp messages short.
  return base64url(signed.slice(0, 16));
}

export async function createShareToken(kind: ShareKind, id: string) {
  const payload = `${kindCodes[kind]}${id}`;
  return `${payload}.${await signature(payload)}`;
}

export async function readShareToken(token: string): Promise<{ kind: ShareKind; id: string } | null> {
  const match = /^([rep])([0-9a-zA-Z-]{8,64})\.([A-Za-z0-9_-]{22})$/.exec(token);
  if (!match) return null;
  const [, code, id, given] = match;
  const expected = await signature(`${code}${id}`);
  if (expected.length !== given.length) return null;
  let difference = 0;
  for (let index = 0; index < expected.length; index++) {
    difference |= expected.charCodeAt(index) ^ given.charCodeAt(index);
  }
  return difference === 0 ? { kind: codeKinds[code], id } : null;
}

export function appOrigin() {
  return (process.env.NEXT_PUBLIC_APP_URL || process.env.BETTER_AUTH_URL || "https://bhadaa.in").replace(/\/$/, "");
}

export async function shareUrl(kind: ShareKind, id: string) {
  return `${appOrigin()}/s/${await createShareToken(kind, id)}`;
}

export async function buildShareLinks(items: { kind: ShareKind; id: string }[]): Promise<ShareLinks> {
  const entries = await Promise.all(
    items.map(async (item) => [shareKey(item.kind, item.id), await shareUrl(item.kind, item.id)] as const),
  );
  return Object.fromEntries(entries);
}
