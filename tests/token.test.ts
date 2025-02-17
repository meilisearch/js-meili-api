import * as assert from "node:assert";
import {
  afterAll,
  beforeEach,
  describe,
  expect,
  test,
  vi,
  type MockInstance,
} from "vitest";
import {
  getClient,
  decode64,
  getKey,
  dataset,
  clearAllIndexes,
  config,
  HOST,
} from "./utils/meilisearch-test-utils.js";
import { createHmac } from "node:crypto";
import { generateTenantToken } from "../src/token.js";
import { MeiliSearch } from "../src/index.js";

const HASH_ALGORITHM = "HS256";
const TOKEN_TYP = "JWT";
const UID = "movies_test";

afterAll(() => {
  return clearAllIndexes(config);
});

test("Should throw error for invalid UID", async () => {
  await assert.rejects(
    generateTenantToken({
      apiKey: "wrong",
      apiKeyUid: "stuff",
    }),
    /^Error: the uid of your key is not a valid UUIDv4$/,
  );
});

test("Should throw error for non-server-side environment", async () => {
  using _ = (() => {
    let userAgentSpy: MockInstance<() => string> | undefined;
    if (typeof navigator !== "undefined" && "userAgent" in navigator) {
      userAgentSpy = vi
        .spyOn(navigator, "userAgent", "get")
        .mockImplementation(() => "ProbablySomeBrowserUA");
    }

    const nodeEvnSpy = vi.spyOn(process, "versions", "get").mockImplementation(
      () =>
        // @ts-expect-error
        undefined,
    );

    return {
      [Symbol.dispose]() {
        userAgentSpy?.mockRestore();
        nodeEvnSpy.mockRestore();
      },
    };
  })();

  await assert.rejects(
    generateTenantToken({
      apiKey: "wrong",
      apiKeyUid: "stuff",
    }),
    /^Error: failed to detect a server-side environment;/,
  );
});

describe.each([{ permission: "Admin" }])(
  "Tests on token generation",
  ({ permission }) => {
    beforeEach(async () => {
      const client = await getClient("Master");
      await client.index(UID).delete();
      await client.index(UID).addDocuments(dataset).waitTask();

      const keys = await client.getKeys();

      const customKeys = keys.results.filter(
        (key) =>
          key.name !== "Default Search API Key" &&
          key.name !== "Default Admin API Key",
      );

      // Delete all custom keys
      await Promise.all(customKeys.map((key) => client.deleteKey(key.uid)));
    });

    test(`${permission} key: create a tenant token and test header`, async () => {
      const client = await getClient(permission);
      const apiKey = await getKey(permission);
      const { uid } = await client.getKey(apiKey);
      const token = await generateTenantToken({
        apiKey,
        apiKeyUid: uid,
      });
      const [header64] = token.split(".");

      // header
      const { typ, alg } = JSON.parse(decode64(header64));
      expect(alg).toEqual(HASH_ALGORITHM);
      expect(typ).toEqual(TOKEN_TYP);
    });

    test(`${permission} key: create a tenant token and test signature`, async () => {
      const client = await getClient(permission);
      const apiKey = await getKey(permission);
      const { uid } = await client.getKey(apiKey);
      const token = await generateTenantToken({
        apiKey,
        apiKeyUid: uid,
      });
      const [header64, payload64, signature64] = token.split(".");

      // signature
      const newSignature = createHmac("sha256", apiKey)
        .update(`${header64}.${payload64}`)
        .digest("base64")
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=/g, "");

      expect(signature64).toEqual(newSignature);
    });

    test(`${permission} key: create a tenant token with default values and test payload`, async () => {
      const client = await getClient(permission);
      const apiKey = await getKey(permission);
      const { uid } = await client.getKey(apiKey);
      const token = await generateTenantToken({
        apiKey,
        apiKeyUid: uid,
      });
      const [_, payload64] = token.split(".");

      // payload
      const { apiKeyUid, exp, searchRules } = JSON.parse(decode64(payload64));

      expect(apiKeyUid).toEqual(uid);
      expect(exp).toBeUndefined();
      expect(searchRules).toEqual(["*"]);
    });

    test(`${permission} key: create a tenant token with array searchRules and test payload`, async () => {
      const client = await getClient(permission);
      const apiKey = await getKey(permission);
      const { uid } = await client.getKey(apiKey);
      const token = await generateTenantToken({
        apiKey,
        apiKeyUid: uid,
        searchRules: [UID],
      });
      const [_, payload64] = token.split(".");

      // payload
      const { apiKeyUid, exp, searchRules } = JSON.parse(decode64(payload64));

      expect(apiKeyUid).toEqual(uid);
      expect(exp).toBeUndefined();
      expect(searchRules).toEqual([UID]);
    });

    test(`${permission} key: create a tenant token with oject search rules and test payload`, async () => {
      const client = await getClient(permission);
      const apiKey = await getKey(permission);
      const { uid } = await client.getKey(apiKey);
      const token = await generateTenantToken({
        apiKey,
        apiKeyUid: uid,
        searchRules: { [UID]: {} },
      });
      const [_, payload64] = token.split(".");

      // payload
      const { apiKeyUid, exp, searchRules } = JSON.parse(decode64(payload64));
      expect(apiKeyUid).toEqual(uid);
      expect(exp).toBeUndefined();
      expect(searchRules).toEqual({ [UID]: {} });
    });

    test(`${permission} key: Search in tenant token with wildcard`, async () => {
      const client = await getClient(permission);
      const apiKey = await getKey(permission);
      const { uid } = await client.getKey(apiKey);

      const token = await generateTenantToken({
        apiKey,
        apiKeyUid: uid,
      });

      const searchClient = new MeiliSearch({ host: HOST, apiKey: token });

      // search
      await expect(
        searchClient.index(UID).search(),
      ).resolves.not.toBeUndefined();
    });

    test(`${permission} key: Search in tenant token with custom api key`, async () => {
      const masterClient = await getClient("master");
      const { uid, key } = await masterClient.createKey({
        expiresAt: null,
        description: "Custom key",
        actions: ["search"],
        indexes: [UID],
      });
      const token = await generateTenantToken({
        apiKey: key,
        apiKeyUid: uid,
      });

      const searchClient = new MeiliSearch({ host: HOST, apiKey: token });

      // search
      await expect(searchClient.index(UID).search()).resolves.toBeDefined();
    });

    test(`${permission} key: Search in tenant token with expireAt`, async () => {
      const client = await getClient(permission);
      const date = new Date("December 17, 4000 03:24:00");
      const apiKey = await getKey(permission);
      const { uid } = await client.getKey(apiKey);
      const token = await generateTenantToken({
        apiKey,
        apiKeyUid: uid,
        expiresAt: date,
      });

      const [_, payload] = token.split(".");
      const searchClient = new MeiliSearch({ host: HOST, apiKey: token });

      expect(JSON.parse(decode64(payload)).exp).toEqual(
        Math.floor(date.getTime() / 1000),
      );
      await expect(
        searchClient.index(UID).search(),
      ).resolves.not.toBeUndefined();
    });

    test(`${permission} key: Search in tenant token with expireAt value set in the past throws an error on usage`, async () => {
      const client = await getClient(permission);
      const apiKey = await getKey(permission);
      const { uid } = await client.getKey(apiKey);
      const date = new Date("December 17, 2000 03:24:00");

      const token = await generateTenantToken({
        apiKey,
        apiKeyUid: uid,
        expiresAt: date,
      });

      const searchClient = new MeiliSearch({ host: HOST, apiKey: token });

      await assert.rejects(
        searchClient.index(UID).search(),
        /^MeiliSearchApiError: Tenant token expired\. Was valid up to `\d+` and we're now `\d+`\.$/,
      );
    });

    test(`${permission} key: Search in tenant token with specific index set to null`, async () => {
      const client = await getClient(permission);
      const apiKey = await getKey(permission);
      const { uid } = await client.getKey(apiKey);
      const token = await generateTenantToken({
        apiKey,
        apiKeyUid: uid,
        searchRules: { [UID]: null },
      });

      const searchClient = new MeiliSearch({ host: HOST, apiKey: token });

      // search
      await expect(
        searchClient.index(UID).search(),
      ).resolves.not.toBeUndefined();
    });

    test(`${permission} key: Search in tenant token with specific index and specific rules`, async () => {
      // add filterable
      const masterClient = await getClient("master");
      await masterClient
        .index(UID)
        .updateFilterableAttributes(["id"])
        .waitTask();
      const client = await getClient(permission);
      const apiKey = await getKey(permission);
      const { uid } = await client.getKey(apiKey);
      const token = await generateTenantToken({
        apiKey,
        apiKeyUid: uid,
        searchRules: { [UID]: { filter: "id = 2" } },
      });

      const searchClient = new MeiliSearch({ host: HOST, apiKey: token });

      // search
      await expect(
        searchClient.index(UID).search(),
      ).resolves.not.toBeUndefined();
    });

    test(`${permission} key: Search in tenant token with empty array throws an error`, async () => {
      const client = await getClient(permission);
      const apiKey = await getKey(permission);
      const { uid } = await client.getKey(apiKey);
      const token = await generateTenantToken({
        apiKey,
        apiKeyUid: uid,
        searchRules: [],
      });

      const searchClient = new MeiliSearch({ host: HOST, apiKey: token });

      // search
      await expect(
        searchClient.index(UID).search("pride"),
      ).rejects.toHaveProperty("cause.code", "invalid_api_key");
    });

    test(`${permission} key: Search in tenant token on index with no permissions `, async () => {
      const client = await getClient(permission);
      const apiKey = await getKey(permission);
      const { uid } = await client.getKey(apiKey);
      const token = await generateTenantToken({
        apiKey,
        apiKeyUid: uid,
        searchRules: { misc: null },
      });

      const searchClient = new MeiliSearch({ host: HOST, apiKey: token });

      // search
      await expect(
        searchClient.index(UID).search("pride"),
      ).rejects.toHaveProperty("cause.code", "invalid_api_key");
    });

    test(`${permission} key: Creates tenant token with an expiration date as UNIX timestamp in the past throws an error on usage`, async () => {
      const client = await getClient(permission);
      const apiKey = await getKey(permission);
      const { uid } = await client.getKey(apiKey);
      const date = Math.floor(
        new Date("December 17, 2000 03:24:00").getTime() / 1000,
      );

      const token = await generateTenantToken({
        apiKey,
        apiKeyUid: uid,
        searchRules: {},
        expiresAt: date,
      });

      const searchClient = new MeiliSearch({ host: HOST, apiKey: token });

      await assert.rejects(
        searchClient.index(UID).search(),
        /^MeiliSearchApiError: Tenant token expired\. Was valid up to `\d+` and we're now `\d+`\.$/,
      );
    });
  },
);
