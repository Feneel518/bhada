// Client-safe helpers for looking up precomputed share links.
export type ShareKind = "rent" | "electricity" | "receipt";
export type ShareLinks = Record<string, string>;

export function shareKey(kind: ShareKind, id: string) {
  return `${kind}:${id}`;
}
