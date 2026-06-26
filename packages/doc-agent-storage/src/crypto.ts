const CRYPTO_KEY_STORAGE = "doc-agent:crypto-key-jwk";

interface StringKeyValueStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
}

function base64ToBytes(value: string): Uint8Array {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

async function loadOrCreateCryptoKey(kvStore: StringKeyValueStorage): Promise<CryptoKey> {
  const existing = kvStore.getItem(CRYPTO_KEY_STORAGE);
  if (existing) {
    const jwk = JSON.parse(existing) as JsonWebKey;
    return crypto.subtle.importKey("jwk", jwk, { name: "AES-GCM", length: 256 }, false, [
      "encrypt",
      "decrypt",
    ]);
  }

  const key = await crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, true, [
    "encrypt",
    "decrypt",
  ]);
  const jwk = await crypto.subtle.exportKey("jwk", key);
  kvStore.setItem(CRYPTO_KEY_STORAGE, JSON.stringify(jwk));
  return key;
}

export async function encryptSecret(plaintext: string): Promise<string> {
  const key = await loadOrCreateCryptoKey(localStorage);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(plaintext);
  const ciphertext = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, encoded);
  return `${bytesToBase64(iv)}:${bytesToBase64(new Uint8Array(ciphertext))}`;
}

export async function decryptSecret(payload: string): Promise<string> {
  const [ivPart, cipherPart] = payload.split(":");
  if (!ivPart || !cipherPart) {
    throw new Error("Invalid encrypted secret format");
  }
  const key = await loadOrCreateCryptoKey(localStorage);
  const iv = base64ToBytes(ivPart);
  const ciphertext = base64ToBytes(cipherPart);
  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: iv as Uint8Array<ArrayBuffer> },
    key,
    ciphertext as Uint8Array<ArrayBuffer>,
  );
  return new TextDecoder().decode(decrypted);
}
