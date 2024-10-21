import { afterAll, beforeEach, describe, expect, test } from "vitest";
import {
  getClient,
  decode64,
  getKey,
  dataset,
  clearAllIndexes,
  config,
  HOST,
} from "./utils/meilisearch-test-utils";
import { createHmac } from "node:crypto";
import MeiliSearch from "../src";

const HASH_ALGORITHM = "HS256";
const TOKEN_TYP = "JWT";
const UID = "movies_test";

type TokenPayload = {
  apiKeyUid?: string;
  exp?: number;
  searchRules?: string[];
};

afterAll(() => {
  return clearAllIndexes(config);
});

describe.each([{ permission: "Admin" }])(
  "Tests on token generation",
  ({ permission }) => {
    beforeEach(async () => {
      const client = await getClient("Master");
      await client.index(UID).delete();
      const { taskUid } = await client.index(UID).addDocuments(dataset);
      await client.waitForTask(taskUid);

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
      const token = await client.generateTenantToken(uid, [], {});
      const [header64] = token.split(".");

      // header
      const { typ, alg } = JSON.parse(decode64(header64)) as {
        typ: string;
        alg: string;
      };
      expect(alg).toEqual(HASH_ALGORITHM);
      expect(typ).toEqual(TOKEN_TYP);
    });

    test(`${permission} key: create a tenant token and test signature`, async () => {
      const client = await getClient(permission);
      const apiKey = await getKey(permission);
      const { uid } = await client.getKey(apiKey);
      const token = await client.generateTenantToken(uid, [], {});
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
      const token = await client.generateTenantToken(uid, [], {});
      const [_, payload64] = token.split(".");

      // payload
      const { apiKeyUid, exp, searchRules } = JSON.parse(
        decode64(payload64),
      ) as TokenPayload;

      expect(apiKeyUid).toEqual(uid);
      expect(exp).toBeUndefined();
      expect(searchRules).toEqual([]);
    });

    test(`${permission} key: create a tenant token with array searchRules and test payload`, async () => {
      const client = await getClient(permission);
      const apiKey = await getKey(permission);
      const { uid } = await client.getKey(apiKey);
      const token = await client.generateTenantToken(uid, [UID]);
      const [_, payload64] = token.split(".");

      // payload
      const { apiKeyUid, exp, searchRules } = JSON.parse(
        decode64(payload64),
      ) as TokenPayload;

      expect(apiKeyUid).toEqual(uid);
      expect(exp).toBeUndefined();
      expect(searchRules).toEqual([UID]);
    });

    test(`${permission} key: create a tenant token with oject search rules and test payload`, async () => {
      const client = await getClient(permission);
      const apiKey = await getKey(permission);
      const { uid } = await client.getKey(apiKey);
      const token = await client.generateTenantToken(uid, { [UID]: {} });
      const [_, payload64] = token.split(".");

      // payload
      const { apiKeyUid, exp, searchRules } = JSON.parse(
        decode64(payload64),
      ) as TokenPayload;
      expect(apiKeyUid).toEqual(uid);
      expect(exp).toBeUndefined();
      expect(searchRules).toEqual({ [UID]: {} });
    });

    test(`${permission} key: Search in tenant token with wildcard`, async () => {
      const client = await getClient(permission);
      const apiKey = await getKey(permission);
      const { uid } = await client.getKey(apiKey);

      const token = await client.generateTenantToken(uid, ["*"]);

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
      const client = await getClient(permission);
      const token = await client.generateTenantToken(uid, ["*"], {
        apiKey: key,
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
      const token = await client.generateTenantToken(uid, ["*"], {
        expiresAt: date,
      });

      const [_, payload] = token.split(".");
      const searchClient = new MeiliSearch({ host: HOST, apiKey: token });

      const { exp } = JSON.parse(decode64(payload)) as TokenPayload;

      expect(exp).toEqual(Math.floor(date.getTime() / 1000));
      await expect(
        searchClient.index(UID).search(),
      ).resolves.not.toBeUndefined();
    });

    test(`${permission} key: Search in tenant token with expireAt value set in the past`, async () => {
      const client = await getClient(permission);
      const apiKey = await getKey(permission);
      const { uid } = await client.getKey(apiKey);
      const date = new Date("December 17, 2000 03:24:00");

      await expect(
        client.generateTenantToken(uid, ["*"], { expiresAt: date }),
      ).rejects.toThrow(
        `Meilisearch: The expiresAt field must be a date in the future.`,
      );
    });

    test(`${permission} key: Search in tenant token with specific index set to null`, async () => {
      const client = await getClient(permission);
      const apiKey = await getKey(permission);
      const { uid } = await client.getKey(apiKey);
      const token = await client.generateTenantToken(uid, {
        [UID]: null,
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
      const { taskUid } = await masterClient
        .index(UID)
        .updateFilterableAttributes(["id"]);
      await masterClient.waitForTask(taskUid);
      const client = await getClient(permission);
      const apiKey = await getKey(permission);
      const { uid } = await client.getKey(apiKey);
      const token = await client.generateTenantToken(uid, {
        [UID]: { filter: "id = 2" },
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
      const token = await client.generateTenantToken(uid, []);

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
      const token = await client.generateTenantToken(uid, { misc: null });

      const searchClient = new MeiliSearch({ host: HOST, apiKey: token });

      // search
      await expect(
        searchClient.index(UID).search("pride"),
      ).rejects.toHaveProperty("cause.code", "invalid_api_key");
    });

    test(`${permission} key: Creates tenant token with an expiration date in the past throws an error`, async () => {
      const client = await getClient(permission);
      const apiKey = await getKey(permission);
      const { uid } = await client.getKey(apiKey);
      const date = new Date("December 17, 2000 03:24:00");

      await expect(
        client.generateTenantToken(
          uid,
          {},
          {
            expiresAt: date,
          },
        ),
      ).rejects.toThrow(
        `Meilisearch: The expiresAt field must be a date in the future.`,
      );
    });

    test(`${permission} key: Creates tenant token with wrong uid type throws an error`, async () => {
      const client = await getClient(permission);

      await expect(client.generateTenantToken("1234", ["*"])).rejects.toThrow(
        `Meilisearch: The uid of your key is not a valid uuid4. To find out the uid of your key use getKey().`,
      );
    });

    test(`${permission} key: Creates a tenant token with no api key in client and in parameters throws an error`, async () => {
      const client = new MeiliSearch({ host: HOST });

      await expect(client.generateTenantToken("123", [])).rejects.toThrow(
        `Meilisearch: The API key used for the token generation must exist and be of type string.`,
      );
    });
  },
);
