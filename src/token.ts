import type { webcrypto } from "node:crypto";
import type {
  TenantTokenGeneratorOptions,
  TokenSearchRules,
} from "./types/index.js";

function getOptionsWithDefaults(options: TenantTokenGeneratorOptions) {
  const {
    searchRules = ["*"],
    algorithm = "HS256",
    force = false,
    ...restOfOptions
  } = options;
  return { searchRules, algorithm, force, ...restOfOptions };
}

type TenantTokenGeneratorOptionsWithDefaults = ReturnType<
  typeof getOptionsWithDefaults
>;

const UUID_V4_REGEXP = /^[0-9a-f]{8}\b(?:-[0-9a-f]{4}\b){3}-[0-9a-f]{12}$/i;
function isValidUUIDv4(uuid: string): boolean {
  return UUID_V4_REGEXP.test(uuid);
}

function encodeToBase64(data: unknown): string {
  // TODO: instead of btoa use Uint8Array.prototype.toBase64() when it becomes available in supported runtime versions
  // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Uint8Array/toBase64
  return btoa(typeof data === "string" ? data : JSON.stringify(data));
}

// missing crypto global for Node.js 18 https://nodejs.org/api/globals.html#crypto_1
let cryptoPonyfill: Promise<Crypto | typeof webcrypto> | undefined;
function getCrypto(): NonNullable<typeof cryptoPonyfill> {
  if (cryptoPonyfill === undefined) {
    cryptoPonyfill =
      typeof crypto === "undefined"
        ? import("node:crypto").then((v) => v.webcrypto)
        : Promise.resolve(crypto);
  }

  return cryptoPonyfill;
}

const textEncoder = new TextEncoder();

/** Create the signature of the token. */
async function sign(
  { apiKey, algorithm }: TenantTokenGeneratorOptionsWithDefaults,
  encodedPayload: string,
  encodedHeader: string,
): Promise<string> {
  const crypto = await getCrypto();

  const cryptoKey = await crypto.subtle.importKey(
    // https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/importKey#raw
    "raw",
    textEncoder.encode(apiKey),
    // https://developer.mozilla.org/en-US/docs/Web/API/HmacImportParams#instance_properties
    { name: "HMAC", hash: `SHA-${algorithm.slice(2)}` },
    // https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/importKey#extractable
    false,
    // https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/importKey#keyusages
    ["sign"],
  );

  const signature = await crypto.subtle.sign(
    "HMAC",
    cryptoKey,
    textEncoder.encode(`${encodedHeader}.${encodedPayload}`),
  );

  // TODO: Same problem as in `encodeToBase64` above
  const digest = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");

  return digest;
}

/** Create the header of the token. */
function getHeader({
  algorithm: alg,
}: TenantTokenGeneratorOptionsWithDefaults): string {
  const header = { alg, typ: "JWT" };
  return encodeToBase64(header).replace(/=/g, "");
}

/**
 * @see {@link https://www.meilisearch.com/docs/learn/security/tenant_token_reference | Tenant token payload reference}
 * @see {@link https://github.com/meilisearch/meilisearch/blob/b21d7aedf9096539041362d438e973a18170f3fc/crates/meilisearch/src/extractors/authentication/mod.rs#L334-L340 | GitHub source code}
 */
type TokenClaims = {
  searchRules: TokenSearchRules;
  exp?: number;
  apiKeyUid: string;
};

/** Create the payload of the token. */
function getPayload({
  searchRules,
  apiKeyUid,
  expiresAt,
}: TenantTokenGeneratorOptionsWithDefaults): string {
  if (!isValidUUIDv4(apiKeyUid)) {
    throw new Error("the uid of your key is not a valid UUIDv4");
  }

  const payload: TokenClaims = { searchRules, apiKeyUid };
  if (expiresAt !== undefined) {
    payload.exp =
      typeof expiresAt === "number"
        ? expiresAt
        : // To get from a Date object the number of seconds since Unix epoch, i.e. Unix timestamp:
          Math.floor(expiresAt.getTime() / 1000);
  }

  return encodeToBase64(payload).replace(/=/g, "");
}

/**
 * Try to detect if the script is running in a server-side runtime.
 *
 * @remarks
 * There is no silver bullet way for determining the environment. Even so, this
 * is the recommended way according to
 * {@link https://min-common-api.proposal.wintercg.org/#navigator-useragent-requirements | WinterCG specs}.
 * {@link https://developer.mozilla.org/en-US/docs/Web/API/Navigator/userAgent | User agent }
 * can be spoofed, `process` can be patched. It should prevent misuse for the
 * overwhelming majority of cases.
 */
function tryDetectEnvironment(): void {
  if (typeof navigator !== "undefined" && "userAgent" in navigator) {
    const { userAgent } = navigator;

    if (
      userAgent.startsWith("Node") ||
      userAgent.startsWith("Deno") ||
      userAgent.startsWith("Bun") ||
      userAgent.startsWith("Cloudflare-Workers")
    ) {
      return;
    }
  }

  // Node.js prior to v21.1.0 doesn't have the above global
  // https://nodejs.org/api/globals.html#navigatoruseragent
  const versions = globalThis.process?.versions;
  if (versions !== undefined && Object.hasOwn(versions, "node")) {
    return;
  }

  throw new Error(
    "failed to detect a server-side environment; do not generate tokens on the frontend in production!\n" +
      "use the `force` option to disable environment detection, consult the documentation (Use at your own risk!)",
  );
}

/**
 * Generate a tenant token.
 *
 * @remarks
 * Warning: while this can be used in browsers with
 * {@link TenantTokenGeneratorOptions.force}, it is only intended for server
 * side. Don't use this in production on the frontend, unless you really know
 * what you're doing!
 * @param options - Options object for tenant token generation
 * @returns The token in JWT (JSON Web Token) format
 * @see {@link https://www.meilisearch.com/docs/learn/security/basic_security | Securing your project}
 */
export async function generateTenantToken(
  options: TenantTokenGeneratorOptions,
): Promise<string> {
  const optionsWithDefaults = getOptionsWithDefaults(options);

  if (!optionsWithDefaults.force) {
    tryDetectEnvironment();
  }

  const encodedPayload = getPayload(optionsWithDefaults);
  const encodedHeader = getHeader(optionsWithDefaults);
  const signature = await sign(
    optionsWithDefaults,
    encodedPayload,
    encodedHeader,
  );

  return `${encodedHeader}.${encodedPayload}.${signature}`;
}
