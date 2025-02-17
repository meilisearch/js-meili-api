import type { Filter } from "./types.js";

/** @see {@link TokenSearchRules} */
export type TokenIndexRules = { filter?: Filter };

/**
 * {@link https://www.meilisearch.com/docs/learn/security/tenant_token_reference#search-rules}
 *
 * @remarks
 * Not well documented.
 * @see {@link https://github.com/meilisearch/meilisearch/blob/b21d7aedf9096539041362d438e973a18170f3fc/crates/meilisearch-auth/src/lib.rs#L271-L277 | GitHub source code}
 */
export type TokenSearchRules =
  | Record<string, TokenIndexRules | null>
  | string[];

/** Options object for tenant token generation. */
export type TenantTokenGeneratorOptions = {
  /** API key used to sign the token. */
  apiKey: string;
  /**
   * The uid of the api key used as issuer of the token.
   *
   * @see {@link https://www.meilisearch.com/docs/learn/security/tenant_token_reference#api-key-uid}
   */
  apiKeyUid: string;
  /**
   * Search rules that are applied to every search.
   *
   * @defaultValue `["*"]`
   */
  searchRules?: TokenSearchRules;
  /**
   * {@link https://en.wikipedia.org/wiki/Unix_time | UNIX timestamp} or
   * {@link Date} object at which the token expires.
   *
   * @see {@link https://www.meilisearch.com/docs/learn/security/tenant_token_reference#expiry-date}
   */
  expiresAt?: number | Date;
  /**
   * Encryption algorithm used to sign the JWT. Supported values by Meilisearch
   * are HS256, HS384, HS512. (HS[number] means HMAC using SHA-[number])
   *
   * @defaultValue `"HS256"`
   * @see {@link https://www.meilisearch.com/docs/learn/security/generate_tenant_token_scratch#prepare-token-header}
   */
  algorithm?: `HS${256 | 384 | 512}`;
  /**
   * By default if a non-safe environment is detected, an error is thrown.
   * Setting this to `true` skips environment detection. This is intended for
   * server-side environments where detection fails or usage in a browser is
   * intentional (Use at your own risk).
   *
   * @defaultValue `false`
   */
  force?: boolean;
};
