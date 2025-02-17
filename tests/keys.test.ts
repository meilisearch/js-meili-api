import { expect, test, describe, beforeEach, afterAll } from "vitest";
import { MeiliSearch } from "../src/index.js";
import { ErrorStatusCode } from "../src/types/index.js";
import {
  clearAllIndexes,
  config,
  getClient,
  getKey,
  HOST,
} from "./utils/meilisearch-test-utils.js";

beforeEach(async () => {
  await clearAllIndexes(config);
});

afterAll(() => {
  return clearAllIndexes(config);
});

describe.each([{ permission: "Master" }, { permission: "Admin" }])(
  "Test on keys",
  ({ permission }) => {
    beforeEach(async () => {
      const client = await getClient("Master");
      await clearAllIndexes(config);

      const keys = await client.getKeys();

      const customKeys = keys.results.filter(
        (key) =>
          key.name !== "Default Search API Key" &&
          key.name !== "Default Admin API Key",
      );

      // Delete all custom keys
      await Promise.all(customKeys.map((key) => client.deleteKey(key.uid)));
    });

    test(`${permission} key: get keys`, async () => {
      const client = await getClient(permission);
      const keys = await client.getKeys();

      const searchKey = keys.results.find(
        (key: any) => key.name === "Default Search API Key",
      );

      expect(searchKey).toBeDefined();
      expect(searchKey).toHaveProperty(
        "description",
        "Use it to search from the frontend",
      );
      expect(searchKey).toHaveProperty("key");
      expect(searchKey).toHaveProperty("actions");
      expect(searchKey).toHaveProperty("indexes");
      expect(searchKey).toHaveProperty("expiresAt", null);
      expect(searchKey).toHaveProperty("createdAt");
      expect(searchKey?.createdAt).toBeInstanceOf(Date);
      expect(searchKey).toHaveProperty("updatedAt");
      expect(searchKey?.updatedAt).toBeInstanceOf(Date);

      const adminKey = keys.results.find(
        (key: any) => key.name === "Default Admin API Key",
      );

      expect(adminKey).toBeDefined();
      expect(adminKey).toHaveProperty(
        "description",
        "Use it for anything that is not a search operation. Caution! Do not expose it on a public frontend",
      );
      expect(adminKey).toHaveProperty("key");
      expect(adminKey).toHaveProperty("actions");
      expect(adminKey).toHaveProperty("indexes");
      expect(adminKey).toHaveProperty("expiresAt", null);
      expect(adminKey).toHaveProperty("createdAt");
      expect(searchKey?.createdAt).toBeInstanceOf(Date);
      expect(adminKey).toHaveProperty("updatedAt");
      expect(searchKey?.updatedAt).toBeInstanceOf(Date);
    });

    test(`${permission} key: get keys with pagination`, async () => {
      const client = await getClient(permission);
      const keys = await client.getKeys({ limit: 1, offset: 2 });

      expect(keys.limit).toEqual(1);
      expect(keys.offset).toEqual(2);
      expect(keys.total).toEqual(2);
    });

    test(`${permission} key: get on key`, async () => {
      const client = await getClient(permission);
      const apiKey = await getKey("Admin");

      const key = await client.getKey(apiKey);

      expect(key).toBeDefined();
      expect(key).toHaveProperty(
        "description",
        "Use it for anything that is not a search operation. Caution! Do not expose it on a public frontend",
      );
      expect(key).toHaveProperty("key");
      expect(key).toHaveProperty("actions");
      expect(key).toHaveProperty("indexes");
      expect(key).toHaveProperty("expiresAt", null);
      expect(key).toHaveProperty("createdAt");
      expect(key).toHaveProperty("updatedAt");
    });

    test(`${permission} key: create key with no expiresAt`, async () => {
      const client = await getClient(permission);
      const uid = "3db051e0-423d-4b5c-a63a-f82a7043dce6";

      const key = await client.createKey({
        uid,
        description: "Indexing Products API key",
        actions: ["documents.add"],
        indexes: ["products"],
        expiresAt: null,
      });

      expect(key).toBeDefined();
      expect(key).toHaveProperty("description", "Indexing Products API key");
      expect(key).toHaveProperty("uid", uid);
      expect(key).toHaveProperty("expiresAt", null);
    });

    test(`${permission} key: create key with actions using wildcards to provide rights`, async () => {
      const client = await getClient(permission);
      const uid = "3db051e0-423d-4b5c-a63a-f82a7043dce6";

      const key = await client.createKey({
        uid,
        description: "Indexing Products API key",
        actions: ["indexes.*", "tasks.*", "documents.*"],
        indexes: ["wildcard_keys_permission"],
        expiresAt: null,
      });

      const newClient = new MeiliSearch({ host: HOST, apiKey: key.key });
      await newClient.createIndex("wildcard_keys_permission"); // test index creation
      const task = await newClient
        .index("wildcard_keys_permission")
        .addDocuments([{ id: 1 }])
        .waitTask(); // test document addition

      expect(key).toBeDefined();
      expect(task.status).toBe("succeeded");
      expect(key).toHaveProperty("description", "Indexing Products API key");
      expect(key).toHaveProperty("uid", uid);
      expect(key).toHaveProperty("expiresAt", null);
    });

    test(`${permission} key: create key with an expiresAt`, async () => {
      const client = await getClient(permission);

      const key = await client.createKey({
        description: "Indexing Products API key",
        actions: ["documents.add"],
        indexes: ["products"],
        expiresAt: new Date("2050-11-13T00:00:00Z"), // Test will fail in 2050
      });

      expect(key).toBeDefined();
      expect(key).toHaveProperty("description", "Indexing Products API key");
      expect(key).toHaveProperty("expiresAt", "2050-11-13T00:00:00Z");
    });

    test(`${permission} key: update a key`, async () => {
      const client = await getClient(permission);

      const key = await client.createKey({
        description: "Indexing Products API key",
        actions: ["documents.add"],
        indexes: ["products"],
        expiresAt: new Date("2050-11-13T00:00:00Z"), // Test will fail in 2050
      });

      const updatedKey = await client.updateKey(key.key, {
        description: "Indexing Products API key 2",
        name: "Product admin",
      });

      expect(updatedKey).toBeDefined();
      expect(updatedKey).toHaveProperty(
        "description",
        "Indexing Products API key 2",
      );
      expect(updatedKey).toHaveProperty("name", "Product admin");
    });

    test(`${permission} key: delete a key`, async () => {
      const client = await getClient(permission);

      const key = await client.createKey({
        description: "Indexing Products API key",
        actions: ["documents.add"],
        indexes: ["products"],
        expiresAt: new Date("2050-11-13T00:00:00Z"), // Test will fail in 2050
      });

      const deletedKey = await client.deleteKey(key.key);

      expect(deletedKey).toBeUndefined();
    });
  },
);

describe.each([{ permission: "Search" }])(
  "Test on keys with search key",
  ({ permission }) => {
    test(`${permission} key: get keys denied`, async () => {
      const client = await getClient(permission);
      await expect(client.getKeys()).rejects.toHaveProperty(
        "cause.code",
        ErrorStatusCode.INVALID_API_KEY,
      );
    });

    test(`${permission} key: create key denied`, async () => {
      const client = await getClient(permission);
      await expect(
        client.createKey({
          description: "Indexing Products API key",
          actions: ["documents.add"],
          indexes: ["products"],
          expiresAt: null,
        }),
      ).rejects.toHaveProperty("cause.code", ErrorStatusCode.INVALID_API_KEY);
    });
  },
);

describe.each([{ permission: "No" }])(
  "Test on keys with No key",
  ({ permission }) => {
    test(`${permission} key: get keys denied`, async () => {
      const client = await getClient(permission);
      await expect(client.getKeys()).rejects.toHaveProperty(
        "cause.code",
        ErrorStatusCode.MISSING_AUTHORIZATION_HEADER,
      );
    });

    test(`${permission} key: create key denied`, async () => {
      const client = await getClient(permission);
      await expect(
        client.createKey({
          description: "Indexing Products API key",
          actions: ["documents.add"],
          indexes: ["products"],
          expiresAt: null,
        }),
      ).rejects.toHaveProperty(
        "cause.code",
        ErrorStatusCode.MISSING_AUTHORIZATION_HEADER,
      );
    });
  },
);
