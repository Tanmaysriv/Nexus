import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
} from "node:crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;
const KEY_LENGTH = 32;

function getEncryptionKey(): Buffer {
  const rawKey = process.env.GITHUB_TOKEN_ENCRYPTION_KEY;

  if (!rawKey) {
    throw new Error(
      "GITHUB_TOKEN_ENCRYPTION_KEY is not configured."
    );
  }

  const key = Buffer.from(rawKey, "base64");

  if (key.length !== KEY_LENGTH) {
    throw new Error(
      "GITHUB_TOKEN_ENCRYPTION_KEY must decode to exactly 32 bytes."
    );
  }

  return key;
}

export function encryptGitHubToken(
  token: string
): string {
  const key = getEncryptionKey();
  const iv = randomBytes(IV_LENGTH);

  const cipher = createCipheriv(
    ALGORITHM,
    key,
    iv
  );

  const encrypted = Buffer.concat([
    cipher.update(token, "utf8"),
    cipher.final(),
  ]);

  const authTag = cipher.getAuthTag();

  return [
    iv.toString("base64"),
    authTag.toString("base64"),
    encrypted.toString("base64"),
  ].join(".");
}

export function decryptGitHubToken(
  encryptedToken: string
): string {
  const key = getEncryptionKey();

  const parts = encryptedToken.split(".");

  if (parts.length !== 3) {
    throw new Error(
      "Invalid encrypted GitHub token format."
    );
  }

  const [ivBase64, authTagBase64, ciphertextBase64] =
    parts;

  const iv = Buffer.from(ivBase64, "base64");
  const authTag = Buffer.from(
    authTagBase64,
    "base64"
  );
  const ciphertext = Buffer.from(
    ciphertextBase64,
    "base64"
  );

  if (
    iv.length !== IV_LENGTH ||
    authTag.length !== AUTH_TAG_LENGTH
  ) {
    throw new Error(
      "Invalid encrypted GitHub token."
    );
  }

  const decipher = createDecipheriv(
    ALGORITHM,
    key,
    iv
  );

  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]);

  return decrypted.toString("utf8");
}
