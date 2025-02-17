import { expect, test, describe, beforeEach, assert } from "vitest";
import {
  clearAllIndexes,
  config,
  getClient,
} from "./utils/meilisearch-test-utils.js";
import { ContentTypeEnum } from "../src/types/index.js";

beforeEach(() => clearAllIndexes(config));

describe.each([{ permission: "Master" }, { permission: "Admin" }])(
  "Test on raw documents addition using `addDocumentsFromString`",
  ({ permission }) => {
    test(`${permission} key: Add documents in CSV format`, async () => {
      const client = await getClient(permission);
      const data = `id,title,comment
123,Pride and Prejudice, A great book
546,Le Petit Prince,a french book`;

      const task = await client
        .index("csv_index")
        .addDocumentsFromString(data, ContentTypeEnum.CSV)
        .waitTask();

      expect(task.details?.receivedDocuments).toBe(2);
      assert.strictEqual(task.status, "succeeded");
    });

    test(`${permission} key: Add documents in CSV format with custom primary key`, async () => {
      const client = await getClient(permission);
      const data = `name,title,comment
123,Pride and Prejudice, A great book
546,Le Petit Prince,a french book`;

      const task = await client
        .index("csv_index")
        .addDocumentsFromString(data, ContentTypeEnum.CSV, {
          primaryKey: "name",
        })
        .waitTask();

      expect(task.details?.receivedDocuments).toBe(2);
      assert.strictEqual(task.status, "succeeded");
    });

    test(`${permission} key: Add documents in CSV format with custom delimiter`, async () => {
      const client = await getClient(permission);
      const data = `name;title;comment
123;Pride and Prejudice; A great book
546;Le Petit Prince;a french book`;

      const task = await client
        .index("csv_index")
        .addDocumentsFromString(data, ContentTypeEnum.CSV, {
          primaryKey: "name",
          csvDelimiter: ";",
        })
        .waitTask();

      expect(task.details?.receivedDocuments).toBe(2);
      assert.strictEqual(task.status, "succeeded");
    });

    test(`${permission} key: Add documents in JSON lines format`, async () => {
      const client = await getClient(permission);
      const data = `{ "id": 123, "title": "Pride and Prejudice", "comment": "A great book" }
{ "id": 456, "title": "Le Petit Prince", "comment": "A french book" }`;

      const task = await client
        .index("jsonl_index")
        .addDocumentsFromString(data, ContentTypeEnum.NDJSON, {})
        .waitTask();

      expect(task.details?.receivedDocuments).toBe(2);
      assert.strictEqual(task.status, "succeeded");
    });

    test(`${permission} key: Add documents in JSON lines with custom primary key`, async () => {
      const client = await getClient(permission);
      const data = `{ "name": 123, "title": "Pride and Prejudice", "comment": "A great book" }
{ "name": 456, "title": "Le Petit Prince", "comment": "A french book" }`;

      const task = await client
        .index("jsonl_index")
        .addDocumentsFromString(data, ContentTypeEnum.NDJSON, {
          primaryKey: "name",
        })
        .waitTask();

      expect(task.details?.receivedDocuments).toBe(2);
      assert.strictEqual(task.status, "succeeded");
    });

    test(`${permission} key: Add documents in JSON format`, async () => {
      const client = await getClient(permission);
      const data = `[{ "id": 123, "title": "Pride and Prejudice", "comment": "A great book" },
{ "id": 456, "title": "Le Petit Prince", "comment": "A french book" }]`;

      const task = await client
        .index("json_index")
        .addDocumentsFromString(data, ContentTypeEnum.JSON)
        .waitTask();

      expect(task.details?.receivedDocuments).toBe(2);
      assert.strictEqual(task.status, "succeeded");
    });

    test(`${permission} key: Add documents in JSON format with custom primary key`, async () => {
      const client = await getClient(permission);
      const data = `[{ "name": 123, "title": "Pride and Prejudice", "comment": "A great book" },
{ "name": 456, "title": "Le Petit Prince", "comment": "A french book" }]`;

      const task = await client
        .index("json_index")
        .addDocumentsFromString(data, ContentTypeEnum.JSON, {
          primaryKey: "name",
        })
        .waitTask();

      expect(task.details?.receivedDocuments).toBe(2);
      assert.strictEqual(task.status, "succeeded");
    });
  },
);

describe.each([{ permission: "Master" }, { permission: "Admin" }])(
  "Test on raw documents update using `updateDocumentsFromString`",
  ({ permission }) => {
    test(`${permission} key: Update documents in CSV format`, async () => {
      const client = await getClient(permission);
      const data = `id,title,comment
123,Pride and Prejudice, A great book
546,Le Petit Prince,a french book`;

      const task = await client
        .index("csv_index")
        .updateDocumentsFromString(data, ContentTypeEnum.CSV)
        .waitTask();

      expect(task.details?.receivedDocuments).toBe(2);
      assert.strictEqual(task.status, "succeeded");
    });

    test(`${permission} key: Update documents in CSV format with custom primary key`, async () => {
      const client = await getClient(permission);
      const data = `name,title,comment
123,Pride and Prejudice, A great book
546,Le Petit Prince,a french book`;

      const task = await client
        .index("csv_index")
        .updateDocumentsFromString(data, ContentTypeEnum.CSV, {
          primaryKey: "name",
        })
        .waitTask();

      expect(task.details?.receivedDocuments).toBe(2);
      assert.strictEqual(task.status, "succeeded");
    });

    test(`${permission} key: Update documents in CSV format with custom delimiter`, async () => {
      const client = await getClient(permission);
      const data = `name;title;comment
123;Pride and Prejudice; A great book
546;Le Petit Prince;a french book`;

      const task = await client
        .index("csv_index")
        .updateDocumentsFromString(data, ContentTypeEnum.CSV, {
          primaryKey: "name",
          csvDelimiter: ";",
        })
        .waitTask();

      expect(task.details?.receivedDocuments).toBe(2);
      assert.strictEqual(task.status, "succeeded");
    });

    test(`${permission} key: Update documents in JSON lines format`, async () => {
      const client = await getClient(permission);
      const data = `{ "id": 123, "title": "Pride and Prejudice", "comment": "A great book" }
{ "id": 456, "title": "Le Petit Prince", "comment": "A french book" }`;

      const task = await client
        .index("jsonl_index")
        .updateDocumentsFromString(data, ContentTypeEnum.NDJSON)
        .waitTask();

      expect(task.details?.receivedDocuments).toBe(2);
      assert.strictEqual(task.status, "succeeded");
    });

    test(`${permission} key: Update documents in JSON lines with custom primary key`, async () => {
      const client = await getClient(permission);
      const data = `{ "name": 123, "title": "Pride and Prejudice", "comment": "A great book" }
{ "name": 456, "title": "Le Petit Prince", "comment": "A french book" }`;

      const task = await client
        .index("jsonl_index")
        .updateDocumentsFromString(data, ContentTypeEnum.NDJSON, {
          primaryKey: "name",
        })
        .waitTask();

      expect(task.details?.receivedDocuments).toBe(2);
      assert.strictEqual(task.status, "succeeded");
    });

    test(`${permission} key: Update documents in JSON format`, async () => {
      const client = await getClient(permission);
      const data = `[{ "id": 123, "title": "Pride and Prejudice", "comment": "A great book" },
{ "id": 456, "title": "Le Petit Prince", "comment": "A french book" }]`;

      const task = await client
        .index("json_index")
        .updateDocumentsFromString(data, ContentTypeEnum.JSON, {})
        .waitTask();

      expect(task.details?.receivedDocuments).toBe(2);
      assert.strictEqual(task.status, "succeeded");
    });

    test(`${permission} key: Update documents in JSON format with custom primary key`, async () => {
      const client = await getClient(permission);
      const data = `[{ "name": 123, "title": "Pride and Prejudice", "comment": "A great book" },
{ "name": 456, "title": "Le Petit Prince", "comment": "A french book" }]`;

      const task = await client
        .index("json_index")
        .updateDocumentsFromString(data, ContentTypeEnum.JSON, {
          primaryKey: "name",
        })
        .waitTask();

      expect(task.details?.receivedDocuments).toBe(2);
      assert.strictEqual(task.status, "succeeded");
    });
  },
);
